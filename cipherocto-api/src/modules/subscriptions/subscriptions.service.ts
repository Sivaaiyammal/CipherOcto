import type { FastifyBaseLogger } from "fastify"

import type { Config } from "../../config.ts"
import { hashToken } from "../../shared/crypto.ts"
import type { AuthContext } from "../../shared/auth-context.ts"
import { AppError, conflict, notFound } from "../../shared/errors.ts"
import type { AppRecord, AppsRepository } from "../apps/apps.repository.ts"
import type { AuditService } from "../audit/audit.service.ts"
import {
  isEntitled,
  PlayVerificationError,
  type PlaySubscription,
  type PlayVerifier,
  type PurchaseState,
} from "./play.ts"
import type {
  EntitlementRecord,
  EntitlementsRepository,
  EventsRepository,
  ProductRecord,
  ProductsRepository,
  ProductStatus,
  PurchaseRecord,
  PurchasesRepository,
} from "./subscriptions.repository.ts"
import { decryptToken, encryptToken } from "./token-cipher.ts"

// ── Public shapes (what routes serialise) ──────────────────────────────────

export type PurchaseView = {
  productId: string
  state: PurchaseState
  entitled: boolean
  expiresAt: string | null
  autoRenewing: boolean
}

export type EntitlementView = { key: string; active: boolean; expiresAt: string | null }

/** Google keeps access during grace; we re-check at least daily so a lost message can't extend it forever. */
const GRACE_RECHECK_MS = 24 * 3_600_000

export type NotificationInput = {
  messageId: string
  packageName: string
  eventTimeMillis?: string
  testNotification?: { version?: string }
  subscriptionNotification?: { notificationType: number; purchaseToken: string; subscriptionId: string }
  voidedPurchaseNotification?: { purchaseToken: string; orderId?: string; productType?: number; refundType?: number }
  oneTimeProductNotification?: unknown
}

export type NotificationOutcome = "processed" | "duplicate" | "ignored"

type Source = "sdk" | "rtdn" | "reconcile" | "admin"

/** Maps a state change to the event we record, or null when nothing meaningful changed. */
export function transitionEvent(
  prev: PurchaseState | null,
  next: PurchaseState,
  prevExpiry: Date | null,
  nextExpiry: Date | null
): string | null {
  if (prev === null) return next === "pending" ? "PENDING" : "PURCHASED"
  if (prev === next) {
    const renewed = next === "active" && nextExpiry && prevExpiry && nextExpiry.getTime() > prevExpiry.getTime()
    return renewed ? "RENEWED" : null
  }
  switch (next) {
    case "active":
      if (prev === "pending") return "PURCHASED"
      if (prev === "canceled" || prev === "expired") return "RESTARTED"
      return "RECOVERED"
    case "canceled":
      return "CANCELED"
    case "grace":
      return "GRACE_PERIOD"
    case "on_hold":
      return "ON_HOLD"
    case "paused":
      return "PAUSED"
    case "expired":
      return "EXPIRED"
    case "revoked":
      return "REVOKED"
    default:
      return "PENDING"
  }
}

export class SubscriptionsService {
  private readonly config: Config
  private readonly apps: AppsRepository
  private readonly products: ProductsRepository
  private readonly purchases: PurchasesRepository
  private readonly entitlements: EntitlementsRepository
  private readonly events: EventsRepository
  private readonly verifier: PlayVerifier
  private readonly audit: AuditService
  private readonly log: FastifyBaseLogger | null

  constructor(deps: {
    config: Config
    apps: AppsRepository
    products: ProductsRepository
    purchases: PurchasesRepository
    entitlements: EntitlementsRepository
    events: EventsRepository
    verifier: PlayVerifier
    audit: AuditService
    log: FastifyBaseLogger | null
  }) {
    this.config = deps.config
    this.apps = deps.apps
    this.products = deps.products
    this.purchases = deps.purchases
    this.entitlements = deps.entitlements
    this.events = deps.events
    this.verifier = deps.verifier
    this.audit = deps.audit
    this.log = deps.log
  }

  // ── Admin: product mapping ───────────────────────────────────────────────

  async listProducts(appId: string) {
    await this.requireApp(appId)
    return this.products.listForApp(appId)
  }

  async createProduct(
    actor: AuthContext,
    appId: string,
    input: { productId: string; entitlement: string; displayName: string; description?: string; status?: ProductStatus },
    ip: string
  ) {
    const app = await this.requireApp(appId)
    const product = await this.products.create({
      appId: app.id,
      productId: input.productId,
      entitlement: input.entitlement,
      displayName: input.displayName,
      description: input.description ?? "",
      status: input.status ?? "draft",
    })
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "subscription.product_created",
      target: `${app.packageName}:${product.productId}`,
      ip,
      detail: { entitlement: product.entitlement, status: product.status },
    })
    return product
  }

  async updateProduct(
    actor: AuthContext,
    appId: string,
    id: string,
    patch: { entitlement?: string; displayName?: string; description?: string; status?: ProductStatus },
    ip: string
  ) {
    const app = await this.requireApp(appId)
    const product = await this.products.byId(app.id, id)
    if (!product) throw notFound("Product not found.")
    await this.products.update(product.id, patch)
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "subscription.product_updated",
      target: `${app.packageName}:${product.productId}`,
      ip,
      detail: { from: { entitlement: product.entitlement, status: product.status }, to: patch },
    })
    return (await this.products.byId(app.id, id))!
  }

  // ── Admin: reporting ─────────────────────────────────────────────────────

  async summary(appId: string) {
    const app = await this.requireApp(appId)
    const [states, activeEntitlements, lastVerifiedAt] = await Promise.all([
      this.purchases.stateCounts(app.id),
      this.entitlements.countActive(app.id, new Date()),
      this.purchases.latestVerification(app.id),
    ])
    return {
      states,
      activeEntitlements,
      // Source timestamp, so the dashboard can show how fresh these numbers are (SKILL.md §4D).
      lastVerifiedAt: lastVerifiedAt ? lastVerifiedAt.toISOString() : null,
      verificationConfigured: this.config.googleServiceAccount !== null,
      notificationsConfigured: this.config.rtdn !== null,
    }
  }

  async recentEvents(appId: string, limit: number) {
    const app = await this.requireApp(appId)
    return this.events.recent(app.id, limit)
  }

  private async requireApp(appId: string): Promise<AppRecord> {
    const app = await this.apps.byId(appId)
    if (!app) throw notFound("App not found.")
    return app
  }

  // ── SDK: products, verify, sync, entitlements ────────────────────────────

  async sdkProducts(app: AppRecord) {
    return (await this.products.listForApp(app.id)).filter((p) => p.status === "active")
  }

  async verifyPurchase(
    app: AppRecord,
    input: { subjectId: string; productId: string; purchaseToken: string }
  ): Promise<{ purchase: PurchaseView; entitlements: EntitlementView[] }> {
    const play = await this.fetchFromPlay(app, input.purchaseToken)
    const result = await this.apply({
      app,
      token: input.purchaseToken,
      play,
      hintSubject: input.subjectId,
      expectedProductId: input.productId,
      source: "sdk",
    })
    return { purchase: this.view(result.purchase), entitlements: await this.entitlementsFor(app, result.purchase.subjectId) }
  }

  /** Restore flow: verify a batch of purchases the device reports, one failure never blocks the rest. */
  async syncPurchases(app: AppRecord, input: { subjectId: string; purchases: { productId: string; purchaseToken: string }[] }) {
    const results: { productId: string; ok: boolean; state?: PurchaseState; error?: string }[] = []
    for (const p of input.purchases) {
      try {
        const out = await this.verifyPurchase(app, { subjectId: input.subjectId, ...p })
        results.push({ productId: p.productId, ok: true, state: out.purchase.state })
      } catch (err) {
        const code = err instanceof AppError ? err.code : "internal_error"
        // Outages must surface so the SDK retries instead of treating them as "not owned".
        if (code === "verification_unavailable") throw err
        results.push({ productId: p.productId, ok: false, error: code })
      }
    }
    return { results, entitlements: await this.entitlementsFor(app, input.subjectId) }
  }

  async entitlementsFor(app: AppRecord, subjectId: string): Promise<EntitlementView[]> {
    const now = new Date()
    return (await this.entitlements.forSubject(app.id, subjectId)).map((e) => this.entitlementView(e, now))
  }

  private entitlementView(e: EntitlementRecord, now: Date): EntitlementView {
    // Don't rely on a webhook arriving to end access: expiry is checked on read too.
    const active = e.active && (e.expiresAt === null || e.expiresAt.getTime() > now.getTime())
    return { key: e.key, active, expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null }
  }

  private view(p: PurchaseRecord): PurchaseView {
    return {
      productId: p.productId,
      state: p.state,
      entitled: isEntitled(p.state, p.expiresAt, new Date()),
      expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
      autoRenewing: p.autoRenewing,
    }
  }

  // ── Core: apply a verified Google state ──────────────────────────────────

  private async fetchFromPlay(app: AppRecord, token: string): Promise<PlaySubscription> {
    try {
      return await this.verifier.getSubscription(app.packageName, token)
    } catch (err) {
      if (err instanceof PlayVerificationError) {
        if (err.kind === "not_found") throw new AppError(422, "invalid_purchase", "That purchase couldn't be verified.")
        if (err.kind === "unconfigured") {
          this.log?.error({ appId: app.id }, "Play verification is not configured or not authorised")
          throw new AppError(503, "verification_unavailable", "Purchase verification isn't available right now.")
        }
        throw new AppError(503, "verification_unavailable", "Purchase verification is temporarily unavailable. Try again shortly.")
      }
      throw err
    }
  }

  /**
   * Writes Google's authoritative state for one purchase: record, event, entitlement,
   * and acknowledgement. Safe to run repeatedly (SDK retry, redelivered RTDN, reconcile).
   */
  private async apply(args: {
    app: AppRecord
    token: string
    play: PlaySubscription
    hintSubject: string | null
    expectedProductId?: string
    source: Source
    providerEventId?: string | null
    detail?: unknown
  }): Promise<{ purchase: PurchaseRecord; eventRecorded: boolean }> {
    const { app, token, play, hintSubject, source } = args

    if (args.expectedProductId && play.productId !== args.expectedProductId) {
      throw new AppError(422, "product_mismatch", "That purchase is for a different product.")
    }
    const product = await this.products.byProductId(app.id, play.productId)
    if (!product || product.status === "archived") {
      throw new AppError(422, "unknown_product", "That product isn't configured for this app.")
    }

    const tokenHash = hashToken(token)
    const existing = await this.purchases.byToken(app.id, tokenHash)

    // A purchase belongs to one subject. Binding it to another is how entitlements get stolen.
    if (existing && hintSubject && existing.subjectId !== hintSubject) {
      throw conflict("purchase_bound_elsewhere", "That purchase is already linked to another account.")
    }
    if (play.obfuscatedAccountId && hintSubject && play.obfuscatedAccountId !== hintSubject) {
      throw new AppError(409, "subject_mismatch", "That purchase was made by a different account.")
    }
    const subjectId = existing?.subjectId ?? hintSubject ?? play.obfuscatedAccountId
    if (!subjectId) throw new AppError(422, "subject_required", "Can't tell which account this purchase belongs to.")

    // Revoked is terminal: a stale "active" read must not resurrect a refunded purchase.
    const nextState: PurchaseState = existing?.state === "revoked" ? "revoked" : play.state

    const purchase = await this.purchases.upsert({
      appId: app.id,
      subjectId,
      productId: play.productId,
      tokenHash,
      tokenCipher: existing?.tokenCipher ?? encryptToken(this.config.purchaseTokenKey, token),
      state: nextState,
      playState: play.playState,
      expiresAt: play.expiresAt,
      autoRenewing: play.autoRenewing,
      acknowledged: play.acknowledged || existing?.acknowledged === true,
      orderId: play.orderId,
      obfuscatedAccountId: play.obfuscatedAccountId,
      testPurchase: play.testPurchase,
      lastVerifiedAt: new Date(),
    })

    const type = transitionEvent(existing?.state ?? null, nextState, existing?.expiresAt ?? null, play.expiresAt)
    let eventRecorded = false
    if (type) {
      eventRecorded = await this.events.append({
        appId: app.id,
        purchaseId: purchase.id,
        subjectId,
        type,
        source,
        providerEventId: args.providerEventId ?? null,
        detail: { productId: play.productId, playState: play.playState, ...(args.detail ? { notification: args.detail } : {}) },
      })
    }

    // An upgrade/downgrade/resubscribe supersedes the purchase it links to.
    if (play.linkedPurchaseToken) await this.supersede(app, play.linkedPurchaseToken, purchase)

    await this.recomputeEntitlement(app.id, subjectId, product.entitlement)
    await this.acknowledgeIfNeeded(app, purchase, token)
    return { purchase, eventRecorded }
  }

  private async supersede(app: AppRecord, linkedToken: string, replacement: PurchaseRecord) {
    const old = await this.purchases.byToken(app.id, hashToken(linkedToken))
    if (!old || old.id === replacement.id || old.state === "expired" || old.state === "revoked") return
    await this.purchases.setState(old.id, "expired")
    await this.events.append({
      appId: app.id,
      purchaseId: old.id,
      subjectId: old.subjectId,
      type: "REPLACED",
      source: "sdk",
      detail: { replacedBy: replacement.productId },
    })
    const product = await this.products.byProductId(app.id, old.productId)
    if (product) await this.recomputeEntitlement(app.id, old.subjectId, product.entitlement)
  }

  /** Google refunds unacknowledged purchases after three days, so this is not optional. */
  private async acknowledgeIfNeeded(app: AppRecord, purchase: PurchaseRecord, token: string) {
    if (purchase.acknowledged) return
    if (!isEntitled(purchase.state, purchase.expiresAt, new Date())) return
    try {
      await this.verifier.acknowledge(app.packageName, purchase.productId, token)
      await this.purchases.markAcknowledged(purchase.id)
    } catch (err) {
      // Access was verified, so keep it; reconciliation retries well inside Google's window.
      this.log?.warn({ appId: app.id, purchaseId: purchase.id, err: (err as Error).message }, "failed to acknowledge purchase")
    }
  }

  private async recomputeEntitlement(appId: string, subjectId: string, key: string) {
    const [purchases, products] = await Promise.all([this.purchases.forSubject(appId, subjectId), this.products.listForApp(appId)])
    const keyOf = new Map<string, string>(products.map((p: ProductRecord) => [p.productId, p.entitlement]))
    const mine = purchases.filter((p) => keyOf.get(p.productId) === key)

    const now = new Date()
    const entitled = mine.filter((p) => isEntitled(p.state, p.expiresAt, now))
    const best = entitled.sort((a, b) => (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0))[0] ?? null

    let expiresAt: Date | null
    if (best) expiresAt = best.state === "grace" ? new Date(now.getTime() + GRACE_RECHECK_MS) : best.expiresAt
    else expiresAt = mine.map((p) => p.expiresAt).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    await this.entitlements.upsert({
      appId,
      subjectId,
      key,
      active: best !== null,
      expiresAt,
      purchaseId: best?.id ?? mine[0]?.id ?? null,
    })
  }

  // ── Real-time Developer Notifications ────────────────────────────────────

  /**
   * Handles one Pub/Sub message. Redelivery is expected: the message id is recorded
   * so a duplicate is a no-op, and state is always re-read from Google rather than
   * trusted from the notification body.
   *
   * Throws on transient failures so the push is retried; returns for everything else.
   */
  async handleNotification(msg: NotificationInput): Promise<NotificationOutcome> {
    if (await this.events.providerEventSeen(msg.messageId)) return "duplicate"

    const app = await this.apps.byPackage(msg.packageName)
    if (!app) {
      this.log?.warn({ packageName: msg.packageName }, "RTDN for an unregistered package ignored")
      return "ignored"
    }
    const base = { appId: app.id, source: "rtdn" as const, providerEventId: msg.messageId }

    if (msg.testNotification) {
      await this.events.append({ ...base, type: "TEST" })
      return "processed"
    }

    if (msg.voidedPurchaseNotification) {
      return this.handleVoided(app, msg.messageId, msg.voidedPurchaseNotification)
    }

    const sub = msg.subscriptionNotification
    if (!sub) {
      await this.events.append({ ...base, type: "IGNORED", detail: { reason: "unsupported notification kind" } })
      return "ignored"
    }

    let play: PlaySubscription
    try {
      play = await this.verifier.getSubscription(app.packageName, sub.purchaseToken)
    } catch (err) {
      if (err instanceof PlayVerificationError && err.kind === "not_found") {
        await this.events.append({ ...base, type: "UNVERIFIABLE", detail: { notificationType: sub.notificationType } })
        return "ignored"
      }
      throw err // unavailable / unconfigured: let Pub/Sub retry
    }

    try {
      const { eventRecorded } = await this.apply({
        app,
        token: sub.purchaseToken,
        play,
        hintSubject: null,
        source: "rtdn",
        providerEventId: msg.messageId,
        detail: { notificationType: sub.notificationType },
      })
      if (!eventRecorded) {
        // Nothing changed, but we still record the message id so a redelivery is skipped.
        await this.events.append({ ...base, type: "NOTIFICATION", detail: { notificationType: sub.notificationType } })
      }
      return "processed"
    } catch (err) {
      if (err instanceof AppError && (err.code === "unknown_product" || err.code === "subject_required")) {
        await this.events.append({ ...base, type: err.code === "unknown_product" ? "UNKNOWN_PRODUCT" : "UNATTRIBUTED", detail: { productId: play.productId } })
        return "ignored"
      }
      throw err
    }
  }

  private async handleVoided(app: AppRecord, messageId: string, voided: NonNullable<NotificationInput["voidedPurchaseNotification"]>): Promise<NotificationOutcome> {
    const base = { appId: app.id, source: "rtdn" as const, providerEventId: messageId }
    // productType 1 = subscription, 2 = one-time product; only subscriptions are modelled so far.
    if (voided.productType !== undefined && voided.productType !== 1) {
      await this.events.append({ ...base, type: "IGNORED", detail: { reason: "not a subscription" } })
      return "ignored"
    }
    const purchase = await this.purchases.byToken(app.id, hashToken(voided.purchaseToken))
    if (!purchase) {
      await this.events.append({ ...base, type: "VOIDED_UNKNOWN" })
      return "ignored"
    }
    await this.purchases.setState(purchase.id, "revoked")
    await this.events.append({
      ...base,
      purchaseId: purchase.id,
      subjectId: purchase.subjectId,
      type: "REVOKED",
      detail: { refundType: voided.refundType ?? null },
    })
    const product = await this.products.byProductId(app.id, purchase.productId)
    if (product) await this.recomputeEntitlement(app.id, purchase.subjectId, product.entitlement)
    return "processed"
  }

  // ── Reconciliation ───────────────────────────────────────────────────────

  /**
   * Re-reads Google's state for purchases we haven't verified recently. This is the
   * safety net for lost, late or out-of-order notifications.
   */
  async reconcile(opts: { staleMs?: number; limit?: number; appId?: string } = {}) {
    const staleMs = opts.staleMs ?? 6 * 3_600_000
    const due = await this.purchases.needingReconcile(new Date(Date.now() - staleMs), opts.limit ?? 200, opts.appId)
    const out = { checked: 0, changed: 0, failed: 0 }

    for (const p of due) {
      out.checked++
      const app = await this.apps.byId(p.appId)
      if (!app) {
        out.failed++
        continue
      }
      try {
        const token = decryptToken(this.config.purchaseTokenKey, p.tokenCipher)
        const play = await this.verifier.getSubscription(app.packageName, token)
        const before = `${p.state}|${p.expiresAt?.getTime() ?? ""}`
        const { purchase } = await this.apply({ app, token, play, hintSubject: p.subjectId, source: "reconcile" })
        if (before !== `${purchase.state}|${purchase.expiresAt?.getTime() ?? ""}`) out.changed++
      } catch (err) {
        if (err instanceof PlayVerificationError && err.kind === "not_found") {
          // Google no longer knows the token: treat as ended rather than leaving access dangling.
          await this.purchases.setState(p.id, "expired")
          const product = await this.products.byProductId(p.appId, p.productId)
          if (product) await this.recomputeEntitlement(p.appId, p.subjectId, product.entitlement)
          await this.events.append({ appId: p.appId, purchaseId: p.id, subjectId: p.subjectId, type: "EXPIRED", source: "reconcile", detail: { reason: "unknown to Google" } })
          out.changed++
        } else {
          out.failed++
          this.log?.warn({ purchaseId: p.id, err: (err as Error).message }, "reconcile failed for purchase")
        }
      }
    }
    return out
  }
}
