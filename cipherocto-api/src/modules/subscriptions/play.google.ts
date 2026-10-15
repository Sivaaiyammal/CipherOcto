import { GoogleAuth, OAuth2Client } from "google-auth-library"
import { z } from "zod"

import {
  PlayVerificationError,
  type PlaySubscription,
  type PlayVerifier,
  type PurchaseState,
  type PushAuthenticator,
} from "./play.ts"

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications"

const STATE_MAP: Record<string, Exclude<PurchaseState, "revoked">> = {
  SUBSCRIPTION_STATE_PENDING: "pending",
  SUBSCRIPTION_STATE_ACTIVE: "active",
  SUBSCRIPTION_STATE_PAUSED: "paused",
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: "grace",
  SUBSCRIPTION_STATE_ON_HOLD: "on_hold",
  SUBSCRIPTION_STATE_CANCELED: "canceled",
  SUBSCRIPTION_STATE_EXPIRED: "expired",
  SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: "expired",
}

// Only the fields we depend on; everything else Google adds is ignored.
const SubscriptionPurchaseV2 = z.object({
  subscriptionState: z.string(),
  latestOrderId: z.string().optional(),
  linkedPurchaseToken: z.string().optional(),
  acknowledgementState: z.string().optional(),
  testPurchase: z.unknown().optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string(),
        expiryTime: z.string().optional(),
        autoRenewingPlan: z.object({ autoRenewEnabled: z.boolean().optional() }).optional(),
      })
    )
    .default([]),
  externalAccountIdentifiers: z.object({ obfuscatedExternalAccountId: z.string().optional() }).optional(),
})

/**
 * Maps Google's `purchases.subscriptionsv2.get` response to our shape.
 * Exported separately so it can be tested against recorded payloads.
 */
export function normalizeSubscriptionV2(json: unknown, wantedProductId?: string): PlaySubscription {
  const p = SubscriptionPurchaseV2.parse(json)
  const line = p.lineItems.find((l) => l.productId === wantedProductId) ?? p.lineItems[0]
  if (!line) throw new PlayVerificationError("not_found", "Purchase has no line items.")

  const state = STATE_MAP[p.subscriptionState]
  if (!state) throw new PlayVerificationError("unavailable", `Unrecognised subscription state ${p.subscriptionState}.`)

  const expiry = line.expiryTime ? new Date(line.expiryTime) : null
  return {
    state,
    playState: p.subscriptionState,
    productId: line.productId,
    expiresAt: expiry && !Number.isNaN(expiry.getTime()) ? expiry : null,
    autoRenewing: line.autoRenewingPlan?.autoRenewEnabled === true,
    acknowledged: p.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    orderId: p.latestOrderId ?? null,
    linkedPurchaseToken: p.linkedPurchaseToken ?? null,
    obfuscatedAccountId: p.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
    testPurchase: p.testPurchase !== undefined && p.testPurchase !== null,
  }
}

export class GooglePlayVerifier implements PlayVerifier {
  private readonly auth: GoogleAuth

  constructor(credentials: Record<string, unknown>) {
    this.auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    })
  }

  private async call<T>(url: string, method: "GET" | "POST", data?: unknown): Promise<T> {
    try {
      const res = await this.auth.request<T>({ url, method, data })
      return res.data
    } catch (err) {
      const status = (err as { response?: { status?: number }; status?: number }).response?.status ?? (err as { status?: number }).status
      // Never include the URL or token in the message: tokens are secrets.
      if (status === 400 || status === 404 || status === 410) throw new PlayVerificationError("not_found", "Google doesn't recognise this purchase.")
      if (status === 401 || status === 403) throw new PlayVerificationError("unconfigured", "The Play service account isn't authorised for this app.")
      throw new PlayVerificationError("unavailable", "Google Play is unavailable. Try again shortly.")
    }
  }

  async getSubscription(packageName: string, purchaseToken: string): Promise<PlaySubscription> {
    const url = `${API}/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`
    const json = await this.call<unknown>(url, "GET")
    try {
      return normalizeSubscriptionV2(json)
    } catch (err) {
      if (err instanceof PlayVerificationError) throw err
      throw new PlayVerificationError("unavailable", "Unexpected response from Google Play.")
    }
  }

  async acknowledge(packageName: string, productId: string, purchaseToken: string): Promise<void> {
    const url = `${API}/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`
    await this.call<unknown>(url, "POST", {})
  }
}

/**
 * Pub/Sub push subscriptions can attach a Google-signed OIDC token. We require it to be
 * valid, for our audience, and issued for the configured service account.
 */
export class GooglePushAuthenticator implements PushAuthenticator {
  private readonly client = new OAuth2Client()
  private readonly audience: string
  private readonly serviceAccountEmail: string

  constructor(audience: string, serviceAccountEmail: string) {
    this.audience = audience
    this.serviceAccountEmail = serviceAccountEmail.toLowerCase()
  }

  async verify(authorizationHeader: string | undefined): Promise<boolean> {
    const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader ?? "")
    if (!match?.[1]) return false
    try {
      const ticket = await this.client.verifyIdToken({ idToken: match[1], audience: this.audience })
      const payload = ticket.getPayload()
      return payload?.email_verified === true && payload.email?.toLowerCase() === this.serviceAccountEmail
    } catch {
      return false
    }
  }
}
