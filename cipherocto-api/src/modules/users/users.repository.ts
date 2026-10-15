import { isValidObjectId } from "mongoose"

import type { Models } from "../../db/models.ts"
import { conflict } from "../../shared/errors.ts"

export type UserStatus = "active" | "suspended"

export type UserRecord = {
  id: string
  email: string
  name: string
  passwordHash: string
  roleId: string
  status: UserStatus
  isDemo: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type UserLean = {
  _id: unknown
  email: string
  name: string
  passwordHash: string
  roleId: string
  status: UserStatus
  isDemo?: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const toRecord = (u: UserLean): UserRecord => ({
  id: String(u._id),
  email: u.email,
  name: u.name,
  passwordHash: u.passwordHash,
  roleId: u.roleId,
  status: u.status,
  isDemo: u.isDemo === true,
  lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  createdAt: u.createdAt.toISOString(),
  updatedAt: u.updatedAt.toISOString(),
})

export class UsersRepository {
  private readonly model: Models["User"]

  constructor(models: Models) {
    this.model = models.User
  }

  async byId(id: string): Promise<UserRecord | null> {
    if (!isValidObjectId(id)) return null
    const u = await this.model.findById(id).lean<UserLean | null>()
    return u ? toRecord(u) : null
  }

  async byEmail(email: string): Promise<UserRecord | null> {
    const u = await this.model.findOne({ email }).lean<UserLean | null>()
    return u ? toRecord(u) : null
  }

  async demoForRole(roleId: string): Promise<UserRecord | null> {
    const u = await this.model.findOne({ isDemo: true, roleId }).lean<UserLean | null>()
    return u ? toRecord(u) : null
  }

  /** Real (non-demo) members, oldest first. */
  async listMembers(): Promise<UserRecord[]> {
    const rows = await this.model.find({ isDemo: { $ne: true } }).sort({ createdAt: 1, email: 1 }).lean<UserLean[]>()
    return rows.map(toRecord)
  }

  async create(input: { email: string; name: string; passwordHash: string; roleId: string; isDemo?: boolean }): Promise<UserRecord> {
    try {
      const doc = await this.model.create({
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        roleId: input.roleId,
        isDemo: input.isDemo === true,
        status: "active",
      })
      return toRecord(doc.toObject() as UserLean)
    } catch (err) {
      // Unique index on email: report the race as a normal conflict.
      if ((err as { code?: number }).code === 11000) throw conflict("email_taken", "A user with that email already exists.")
      throw err
    }
  }

  async update(id: string, patch: { name?: string; roleId?: string; status?: UserStatus; passwordHash?: string }): Promise<void> {
    const set = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
    if (Object.keys(set).length === 0) return
    await this.model.updateOne({ _id: id }, { $set: set })
  }

  async markLogin(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } })
  }

  async countActiveAdmins(): Promise<number> {
    return this.model.countDocuments({ roleId: "admin", status: "active", isDemo: { $ne: true } })
  }
}
