import { isValidObjectId } from "mongoose"

import type { Models } from "../../db/models.ts"
import { conflict } from "../../shared/errors.ts"

export type AppStatus = "development" | "testing" | "production" | "maintenance" | "archived"

export type AppRecord = {
  id: string
  name: string
  packageName: string
  /** Public URL segment: `/<slug>/privacy`. */
  slug: string
  platform: "android"
  status: AppStatus
  owner: string
  category: string
  techStack: string
  playConsoleUrl: string
  createdAt: string
  updatedAt: string
}

export type SdkKeyRecord = {
  /** SHA-256 of the key; doubles as the public handle used to revoke it. */
  id: string
  appId: string
  prefix: string
  label: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

type AppLean = {
  _id: unknown
  name: string
  packageName: string
  slug?: string
  platform: "android"
  status: AppStatus
  owner?: string
  category?: string
  techStack?: string
  playConsoleUrl?: string
  createdAt: Date
  updatedAt: Date
}

type KeyLean = {
  _id: string
  appId: unknown
  prefix: string
  label?: string
  createdAt: Date
  lastUsedAt?: Date | null
  revokedAt?: Date | null
}

const toApp = (a: AppLean): AppRecord => ({
  id: String(a._id),
  name: a.name,
  packageName: a.packageName,
  slug: a.slug ?? "",
  platform: a.platform,
  status: a.status,
  owner: a.owner ?? "",
  category: a.category ?? "",
  techStack: a.techStack ?? "",
  playConsoleUrl: a.playConsoleUrl ?? "",
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
})

const toKey = (k: KeyLean): SdkKeyRecord => ({
  id: k._id,
  appId: String(k.appId),
  prefix: k.prefix,
  label: k.label ?? "",
  createdAt: k.createdAt.toISOString(),
  lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
  revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
})

export class AppsRepository {
  private readonly apps: Models["App"]
  private readonly keys: Models["SdkKey"]

  constructor(models: Models) {
    this.apps = models.App
    this.keys = models.SdkKey
  }

  async list(): Promise<AppRecord[]> {
    return (await this.apps.find().sort({ name: 1 }).lean<AppLean[]>()).map(toApp)
  }

  async byId(id: string): Promise<AppRecord | null> {
    if (!isValidObjectId(id)) return null
    const a = await this.apps.findById(id).lean<AppLean | null>()
    return a ? toApp(a) : null
  }

  async byPackage(packageName: string): Promise<AppRecord | null> {
    const a = await this.apps.findOne({ platform: "android", packageName }).lean<AppLean | null>()
    return a ? toApp(a) : null
  }

  async bySlug(slug: string): Promise<AppRecord | null> {
    const a = await this.apps.findOne({ slug }).lean<AppLean | null>()
    return a ? toApp(a) : null
  }

  async allSlugs(): Promise<Set<string>> {
    const rows = await this.apps.find({ slug: { $type: "string" } }, { slug: 1 }).lean<{ slug: string }[]>()
    return new Set(rows.map((r) => r.slug))
  }

  async create(input: {
    name: string
    packageName: string
    slug: string
    status: AppStatus
    owner: string
    category: string
    techStack: string
    playConsoleUrl: string
  }) {
    try {
      const doc = await this.apps.create({ ...input, platform: "android" })
      return toApp(doc.toObject() as AppLean)
    } catch (err) {
      throw this.duplicate(err)
    }
  }

  async update(id: string, patch: Partial<Pick<AppRecord, "name" | "slug" | "status" | "owner" | "category" | "techStack" | "playConsoleUrl">>) {
    const set = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
    if (!Object.keys(set).length) return
    try {
      await this.apps.updateOne({ _id: id }, { $set: set })
    } catch (err) {
      throw this.duplicate(err)
    }
  }

  /** Maps a unique-index violation to the right 409; anything else passes through. */
  private duplicate(err: unknown) {
    if ((err as { code?: number }).code !== 11000) return err
    const index = String((err as { message?: string }).message ?? "")
    return index.includes("apps_slug_unique") || index.includes("slug")
      ? conflict("slug_taken", "That URL name is already used by another app.")
      : conflict("package_taken", "An app with that package name is already registered.")
  }

  // ── SDK keys ───────────────────────────────────────────────────────────

  async createKey(k: { id: string; appId: string; prefix: string; label: string; createdBy: string | null }) {
    const doc = await this.keys.create({ _id: k.id, appId: k.appId, prefix: k.prefix, label: k.label, createdBy: k.createdBy })
    return toKey(doc.toObject() as KeyLean)
  }

  async keyById(id: string): Promise<SdkKeyRecord | null> {
    const k = await this.keys.findById(id).lean<KeyLean | null>()
    return k ? toKey(k) : null
  }

  async keysForApp(appId: string): Promise<SdkKeyRecord[]> {
    if (!isValidObjectId(appId)) return []
    return (await this.keys.find({ appId }).sort({ createdAt: -1 }).lean<KeyLean[]>()).map(toKey)
  }

  async revokeKey(appId: string, keyId: string): Promise<boolean> {
    if (!isValidObjectId(appId)) return false
    const res = await this.keys.updateOne({ _id: keyId, appId, revokedAt: null }, { $set: { revokedAt: new Date() } })
    return res.modifiedCount > 0
  }

  async touchKey(id: string): Promise<void> {
    await this.keys.updateOne({ _id: id }, { $set: { lastUsedAt: new Date() } })
  }
}
