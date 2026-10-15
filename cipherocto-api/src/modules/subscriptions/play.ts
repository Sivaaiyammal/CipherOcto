/**
 * The seam between CipherOcto and Google Play.
 *
 * Business rules depend on this interface, not on Google's REST shapes, so the
 * subscription logic is fully testable offline and a second provider could be
 * added later without touching it.
 */

/** Our normalized lifecycle. `revoked` is set by voided-purchase notifications. */
export type PurchaseState = "pending" | "active" | "canceled" | "grace" | "on_hold" | "paused" | "expired" | "revoked"

export type PlaySubscription = {
  state: Exclude<PurchaseState, "revoked">
  /** Google's own state string, kept for support and audit. */
  playState: string
  productId: string
  expiresAt: Date | null
  autoRenewing: boolean
  acknowledged: boolean
  orderId: string | null
  /** Set when this purchase replaces an earlier one (upgrade, downgrade, resubscribe). */
  linkedPurchaseToken: string | null
  /** The account id the app attached at purchase time; proves who the purchase is for. */
  obfuscatedAccountId: string | null
  testPurchase: boolean
}

export type VerifyFailure =
  /** Google says this token doesn't exist (forged, wrong app, or expired from their records). */
  | "not_found"
  /** Credentials or permissions are wrong: an operator problem, not the caller's. */
  | "unconfigured"
  /** Google is unreachable or throttling us: safe to retry. */
  | "unavailable"

export class PlayVerificationError extends Error {
  readonly kind: VerifyFailure

  constructor(kind: VerifyFailure, message: string) {
    super(message)
    this.name = "PlayVerificationError"
    this.kind = kind
  }
}

export interface PlayVerifier {
  getSubscription(packageName: string, purchaseToken: string): Promise<PlaySubscription>
  acknowledge(packageName: string, productId: string, purchaseToken: string): Promise<void>
}

/** Verifies the Pub/Sub push's OIDC token. Anything unauthenticated must be refused. */
export interface PushAuthenticator {
  verify(authorizationHeader: string | undefined): Promise<boolean>
}

/**
 * Whether a purchase currently entitles the user to paid access.
 *
 * - active / canceled: until the paid period ends (canceled = won't renew, still paid for)
 * - grace: Google is retrying payment and wants access kept; bounded by the caller
 * - everything else: no access
 */
export function isEntitled(state: PurchaseState, expiresAt: Date | null, now: Date): boolean {
  switch (state) {
    case "active":
    case "canceled":
      return expiresAt !== null && expiresAt.getTime() > now.getTime()
    case "grace":
      return true
    default:
      return false
  }
}

/** Used when no service account is configured: fails closed, never grants. */
export class UnconfiguredVerifier implements PlayVerifier {
  async getSubscription(): Promise<PlaySubscription> {
    throw new PlayVerificationError("unconfigured", "Google Play verification is not configured.")
  }
  async acknowledge(): Promise<void> {
    throw new PlayVerificationError("unconfigured", "Google Play verification is not configured.")
  }
}

export class UnconfiguredPushAuthenticator implements PushAuthenticator {
  async verify(): Promise<boolean> {
    return false
  }
}
