import { isValidObjectId } from "mongoose"

import type { Models } from "../../db/models.ts"
import { conflict } from "../../shared/errors.ts"

export type PolicyKind = "privacy"

export type PolicyVersion = {
  version: number
  publishedAt: string
  publishedByEmail: string | null
}

export type PolicyRecord = PolicyVersion & { html: string }

type PolicyLean = {
  version: number
  html: string
  publishedByEmail?: string | null
  createdAt: Date
}

const toVersion = (p: PolicyLean): PolicyVersion => ({
  version: p.version,
  publishedAt: p.createdAt.toISOString(),
  publishedByEmail: p.publishedByEmail ?? null,
})
const toRecord = (p: PolicyLean): PolicyRecord => ({ ...toVersion(p), html: p.html })

export class PoliciesRepository {
  private readonly policies: Models["AppPolicy"]

  constructor(models: Models) {
    this.policies = models.AppPolicy
  }

  async latest(appId: string, kind: PolicyKind): Promise<PolicyRecord | null> {
    if (!isValidObjectId(appId)) return null
    const p = await this.policies.findOne({ appId, kind }).sort({ version: -1 }).lean<PolicyLean | null>()
    return p ? toRecord(p) : null
  }

  async byVersion(appId: string, kind: PolicyKind, version: number): Promise<PolicyRecord | null> {
    if (!isValidObjectId(appId)) return null
    const p = await this.policies.findOne({ appId, kind, version }).lean<PolicyLean | null>()
    return p ? toRecord(p) : null
  }

  async versions(appId: string, kind: PolicyKind): Promise<PolicyVersion[]> {
    if (!isValidObjectId(appId)) return []
    const rows = await this.policies
      .find({ appId, kind }, { version: 1, publishedByEmail: 1, createdAt: 1 })
      .sort({ version: -1 })
      .lean<PolicyLean[]>()
    return rows.map(toVersion)
  }

  /** Appends the next version. The unique index makes concurrent publishes retry, never overwrite. */
  async publish(
    appId: string,
    kind: PolicyKind,
    html: string,
    actor: { id: string; email: string }
  ): Promise<PolicyRecord> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.policies.findOne({ appId, kind }, { version: 1 }).sort({ version: -1 }).lean<{ version: number } | null>()
      try {
        const doc = await this.policies.create({
          appId,
          kind,
          version: (last?.version ?? 0) + 1,
          html,
          publishedBy: actor.id,
          publishedByEmail: actor.email,
        })
        return toRecord(doc.toObject() as PolicyLean)
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err
      }
    }
    throw conflict("publish_conflict", "Another publish was in progress. Try again.")
  }
}
