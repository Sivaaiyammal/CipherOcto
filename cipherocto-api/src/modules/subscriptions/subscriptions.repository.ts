import { isValidObjectId, Types } from "mongoose"

import type { Models } from "../../db/models.ts"
import { conflict } from "../../shared/errors.ts"
import type { PurchaseState } from "./play.ts"

// ── Records ────────────────────────────────────────────────────────────────

export type ProductStatus = "draft" | "active" | "archived"

export type ProductRecord = {
  id: string
  appId: string
  productId: string
  entitlement: string
  displayName: string
  description: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type PurchaseRecord = {
  id: string
  appId: string
  subjectId: string
  productId: string
  tokenHash: string
  tokenCipher: string
  state: PurchaseState
  playState: string
  expiresAt: Date | null
  autoRenewing: boolean
  acknowledged: boolean
  orderId: string | null
  obfuscatedAccountId: string | null
  testPurchase: boolean
  lastVerifiedAt: Date
}

export type EntitlementRecord = {
  appId: string
  subjectId: string
  key: string
  active: boolean
  expiresAt: Date | null
  purchaseId: string | null
}

export type EventRecord = {
  id: string
  appId: string
  purchaseId: string | null
  subjectId: string | null
  type: string
  source: "sdk" | "rtdn" | "reconcile" | "admin"
  providerEventId: string | null
  at: string
  detail: unknown
}

type Lean = Record<string, unknown> & { _id: unknown }

const oid = (v: unknown) => (v == null ? null : String(v))

// ── Products ───────────────────────────────────────────────────────────────

const toProduct = (p: Lean): ProductRecord => ({
  id: String(p._id),
  appId: String(p.appId),
  productId: p.productId as string,
  entitlement: p.entitlement as string,
  displayName: p.displayName as string,
  description: (p.description as string) ?? "",
  status: p.status as ProductStatus,
  createdAt: (p.createdAt as Date).toISOString(),
  updatedAt: (p.updatedAt as Date).toISOString(),
})

export class ProductsRepository {
  private readonly model: Models["Product"]

  constructor(models: Models) {
    this.model = models.Product
  }

  async listForApp(appId: string): Promise<ProductRecord[]> {
    if (!isValidObjectId(appId)) return []
    return (await this.model.find({ appId }).sort({ productId: 1 }).lean<Lean[]>()).map(toProduct)
  }

  async byId(appId: string, id: string): Promise<ProductRecord | null> {
    if (!isValidObjectId(appId) || !isValidObjectId(id)) return null
    const p = await this.model.findOne({ _id: id, appId }).lean<Lean | null>()
    return p ? toProduct(p) : null
  }

  async byProductId(appId: string, productId: string): Promise<ProductRecord | null> {
    if (!isValidObjectId(appId)) return null
    const p = await this.model.findOne({ appId, productId }).lean<Lean | null>()
    return p ? toProduct(p) : null
  }

  async create(input: { appId: string; productId: string; entitlement: string; displayName: string; description: string; status: ProductStatus }) {
    try {
      const doc = await this.model.create(input)
      return toProduct(doc.toObject() as Lean)
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw conflict("product_exists", "That product is already mapped for this app.")
      }
      throw err
    }
  }

  async update(id: string, patch: Partial<Pick<ProductRecord, "entitlement" | "displayName" | "description" | "status">>) {
    const set = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
    if (Object.keys(set).length) await this.model.updateOne({ _id: id }, { $set: set })
  }
}

// ── Purchases ──────────────────────────────────────────────────────────────

const toPurchase = (p: Lean): PurchaseRecord => ({
  id: String(p._id),
  appId: String(p.appId),
  subjectId: p.subjectId as string,
  productId: p.productId as string,
  tokenHash: p.tokenHash as string,
  tokenCipher: p.tokenCipher as string,
  state: p.state as PurchaseState,
  playState: (p.playState as string) ?? "",
  expiresAt: (p.expiresAt as Date | null) ?? null,
  autoRenewing: p.autoRenewing === true,
  acknowledged: p.acknowledged === true,
  orderId: (p.orderId as string | null) ?? null,
  obfuscatedAccountId: (p.obfuscatedAccountId as string | null) ?? null,
  testPurchase: p.testPurchase === true,
  lastVerifiedAt: p.lastVerifiedAt as Date,
})

export type PurchaseWrite = Omit<PurchaseRecord, "id">

export class PurchasesRepository {
  private readonly model: Models["Purchase"]

  constructor(models: Models) {
    this.model = models.Purchase
  }

  async byToken(appId: string, tokenHash: string): Promise<PurchaseRecord | null> {
    if (!isValidObjectId(appId)) return null
    const p = await this.model.findOne({ appId, tokenHash }).lean<Lean | null>()
    return p ? toPurchase(p) : null
  }

  async forSubject(appId: string, subjectId: string): Promise<PurchaseRecord[]> {
    if (!isValidObjectId(appId)) return []
    return (await this.model.find({ appId, subjectId }).lean<Lean[]>()).map(toPurchase)
  }

  /** Inserts or fully replaces the record for (app, tokenHash). Idempotent by design. */
  async upsert(w: PurchaseWrite): Promise<PurchaseRecord> {
    const { appId, tokenHash, ...rest } = w
    const doc = await this.model
      .findOneAndUpdate({ appId, tokenHash }, { $set: { ...rest }, $setOnInsert: { appId, tokenHash } }, { upsert: true, returnDocument: "after" })
      .lean<Lean>()
    return toPurchase(doc)
  }

  async setState(id: string, state: PurchaseState) {
    await this.model.updateOne({ _id: id }, { $set: { state } })
  }

  async markAcknowledged(id: string) {
    await this.model.updateOne({ _id: id }, { $set: { acknowledged: true } })
  }

  /** Non-terminal purchases not verified since `before`, or entitled-but-unacknowledged ones. */
  async needingReconcile(before: Date, limit: number, appId?: string): Promise<PurchaseRecord[]> {
    const filter: Record<string, unknown> = {
      state: { $in: ["pending", "active", "canceled", "grace", "on_hold", "paused"] },
      lastVerifiedAt: { $lt: before },
    }
    if (appId && isValidObjectId(appId)) filter.appId = appId
    return (await this.model.find(filter).sort({ lastVerifiedAt: 1 }).limit(limit).lean<Lean[]>()).map(toPurchase)
  }

  async stateCounts(appId: string): Promise<Record<string, number>> {
    if (!isValidObjectId(appId)) return {}
    const rows = await this.model.aggregate<{ _id: string; n: number }>([
      { $match: { appId: new Types.ObjectId(appId) } },
      { $group: { _id: "$state", n: { $sum: 1 } } },
    ])
    return Object.fromEntries(rows.map((r) => [r._id, r.n]))
  }

  async latestVerification(appId: string): Promise<Date | null> {
    if (!isValidObjectId(appId)) return null
    const p = await this.model.findOne({ appId }).sort({ lastVerifiedAt: -1 }).lean<Lean | null>()
    return p ? (p.lastVerifiedAt as Date) : null
  }
}

// ── Entitlements ───────────────────────────────────────────────────────────

const toEntitlement = (e: Lean): EntitlementRecord => ({
  appId: String(e.appId),
  subjectId: e.subjectId as string,
  key: e.key as string,
  active: e.active === true,
  expiresAt: (e.expiresAt as Date | null) ?? null,
  purchaseId: oid(e.purchaseId),
})

export class EntitlementsRepository {
  private readonly model: Models["Entitlement"]

  constructor(models: Models) {
    this.model = models.Entitlement
  }

  async upsert(e: Omit<EntitlementRecord, never>): Promise<void> {
    await this.model.updateOne(
      { appId: e.appId, subjectId: e.subjectId, key: e.key },
      { $set: { active: e.active, expiresAt: e.expiresAt, purchaseId: e.purchaseId } },
      { upsert: true }
    )
  }

  async forSubject(appId: string, subjectId: string): Promise<EntitlementRecord[]> {
    if (!isValidObjectId(appId)) return []
    return (await this.model.find({ appId, subjectId }).sort({ key: 1 }).lean<Lean[]>()).map(toEntitlement)
  }

  async countActive(appId: string, now: Date): Promise<number> {
    if (!isValidObjectId(appId)) return 0
    return this.model.countDocuments({ appId, active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
  }
}

// ── Events ─────────────────────────────────────────────────────────────────

const toEvent = (e: Lean): EventRecord => ({
  id: String(e._id),
  appId: String(e.appId),
  purchaseId: oid(e.purchaseId),
  subjectId: (e.subjectId as string | null) ?? null,
  type: e.type as string,
  source: e.source as EventRecord["source"],
  providerEventId: (e.providerEventId as string | null) ?? null,
  at: (e.at as Date).toISOString(),
  detail: e.detail ?? null,
})

export class EventsRepository {
  private readonly model: Models["SubscriptionEvent"]

  constructor(models: Models) {
    this.model = models.SubscriptionEvent
  }

  async providerEventSeen(providerEventId: string): Promise<boolean> {
    return (await this.model.exists({ providerEventId })) !== null
  }

  /** Returns false when the provider event id was already recorded (a redelivery). */
  async append(e: {
    appId: string
    purchaseId?: string | null
    subjectId?: string | null
    type: string
    source: EventRecord["source"]
    providerEventId?: string | null
    detail?: unknown
  }): Promise<boolean> {
    try {
      await this.model.create({
        appId: e.appId,
        purchaseId: e.purchaseId ?? null,
        subjectId: e.subjectId ?? null,
        type: e.type,
        source: e.source,
        providerEventId: e.providerEventId ?? null,
        at: new Date(),
        detail: e.detail ?? null,
      })
      return true
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return false
      throw err
    }
  }

  async recent(appId: string, limit: number): Promise<EventRecord[]> {
    if (!isValidObjectId(appId)) return []
    return (await this.model.find({ appId }).sort({ at: -1, _id: -1 }).limit(limit).lean<Lean[]>()).map(toEvent)
  }
}
