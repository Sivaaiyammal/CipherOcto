import { isValidObjectId } from "mongoose"

import type { Models } from "../../db/models.ts"

export type SessionRecord = {
  id: string
  userId: string
  remember: boolean
  lastSeenAt: Date
  expiresAt: Date
  revokedAt: Date | null
}

type SessionLean = {
  _id: string
  userId: unknown
  remember: boolean
  lastSeenAt: Date
  expiresAt: Date
  revokedAt: Date | null
}

export class SessionsRepository {
  private readonly model: Models["Session"]

  constructor(models: Models) {
    this.model = models.Session
  }

  async create(s: { id: string; userId: string; remember: boolean; ip: string | null; userAgent: string | null; expiresAt: Date }) {
    await this.model.create({
      _id: s.id,
      userId: s.userId,
      remember: s.remember,
      ip: s.ip,
      userAgent: s.userAgent?.slice(0, 255) ?? null,
      lastSeenAt: new Date(),
      expiresAt: s.expiresAt,
      revokedAt: null,
    })
  }

  async find(id: string): Promise<SessionRecord | null> {
    const s = await this.model.findById(id).lean<SessionLean | null>()
    if (!s) return null
    return {
      id: s._id,
      userId: String(s.userId),
      remember: s.remember,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt ?? null,
    }
  }

  async touch(id: string) {
    await this.model.updateOne({ _id: id }, { $set: { lastSeenAt: new Date() } })
  }

  async revoke(id: string) {
    await this.model.updateOne({ _id: id, revokedAt: null }, { $set: { revokedAt: new Date() } })
  }

  async revokeAllForUser(userId: string, exceptId?: string) {
    if (!isValidObjectId(userId)) return
    await this.model.updateMany(
      { userId, revokedAt: null, ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
      { $set: { revokedAt: new Date() } }
    )
  }
}
