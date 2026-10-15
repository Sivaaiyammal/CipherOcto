import type { Models } from "../../db/models.ts"

export type AuditEntry = {
  actorId?: string | null
  /** Snapshot of the actor's email at the time, so the log survives renames and deletions. */
  actorEmail?: string | null
  action: string
  target?: string | null
  ip?: string | null
  detail?: unknown
}

export type AuditRecord = {
  id: string
  at: string
  actorId: string | null
  actorEmail: string | null
  action: string
  target: string | null
  ip: string | null
  detail: unknown
}

type AuditLean = {
  _id: unknown
  at: Date
  actorId: string | null
  actorEmail?: string | null
  action: string
  target: string | null
  ip: string | null
  detail: unknown
}

export class AuditRepository {
  private readonly model: Models["AuditLog"]

  constructor(models: Models) {
    this.model = models.AuditLog
  }

  async append(entry: AuditEntry): Promise<void> {
    await this.model.create({
      at: new Date(),
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      action: entry.action,
      target: entry.target ?? null,
      ip: entry.ip ?? null,
      detail: entry.detail ?? null,
    })
  }

  async recent(limit: number): Promise<AuditRecord[]> {
    const rows = await this.model.find().sort({ at: -1, _id: -1 }).limit(limit).lean<AuditLean[]>()
    return rows.map((r) => ({
      id: String(r._id),
      at: r.at.toISOString(),
      actorId: r.actorId,
      actorEmail: r.actorEmail ?? null,
      action: r.action,
      target: r.target,
      ip: r.ip,
      detail: r.detail ?? null,
    }))
  }
}
