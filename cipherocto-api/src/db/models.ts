import { Schema, type Connection } from "mongoose"

// Plain shapes of what is stored. Repositories map these to domain types, so
// Mongoose never leaks past the `*.repository.ts` files.

export type UserDoc = {
  _id: unknown
  email: string
  name: string
  passwordHash: string
  roleId: string
  status: "active" | "suspended"
  isDemo: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type SessionDoc = {
  _id: string
  userId: unknown
  remember: boolean
  ip: string | null
  userAgent: string | null
  lastSeenAt: Date
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

export type RoleDoc = {
  _id: string
  label: string
  description: string
  permissions: string[]
  isSystem: boolean
}

export type AuditDoc = {
  _id: unknown
  at: Date
  actorId: string | null
  actorEmail: string | null
  action: string
  target: string | null
  ip: string | null
  detail: unknown
}

export type ThrottleDoc = {
  _id: string
  count: number
  windowEnd: Date
}

/**
 * Models are built per connection (not on the global mongoose instance) so each
 * app instance — and each test — owns an isolated database handle.
 *
 * `autoIndex` is off: indexes are created by migrations, never as a side effect
 * of starting the server.
 */
export function createModels(conn: Connection) {
  const opts = { autoIndex: false, versionKey: false } as const

  const User = conn.model(
    "User",
    new Schema(
      {
        email: { type: String, required: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        roleId: { type: String, required: true },
        status: { type: String, enum: ["active", "suspended"], default: "active" },
        isDemo: { type: Boolean, default: false },
        lastLoginAt: { type: Date, default: null },
      },
      { ...opts, timestamps: true, collection: "users" }
    )
  )

  const Session = conn.model(
    "Session",
    new Schema(
      {
        _id: { type: String },
        userId: { type: Schema.Types.ObjectId, required: true },
        remember: { type: Boolean, default: false },
        ip: { type: String, default: null },
        userAgent: { type: String, default: null },
        lastSeenAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null },
      },
      { ...opts, timestamps: { createdAt: true, updatedAt: false }, collection: "sessions" }
    )
  )

  const Role = conn.model(
    "Role",
    new Schema(
      {
        _id: { type: String },
        label: { type: String, required: true },
        description: { type: String, default: "" },
        permissions: { type: [String], default: [] },
        isSystem: { type: Boolean, default: true },
      },
      { ...opts, collection: "roles" }
    )
  )

  const AuditLog = conn.model(
    "AuditLog",
    new Schema(
      {
        at: { type: Date, required: true },
        actorId: { type: String, default: null },
        actorEmail: { type: String, default: null },
        action: { type: String, required: true },
        target: { type: String, default: null },
        ip: { type: String, default: null },
        detail: { type: Schema.Types.Mixed, default: null },
      },
      { ...opts, collection: "audit_logs" }
    )
  )

  const Throttle = conn.model(
    "LoginThrottle",
    new Schema(
      {
        _id: { type: String },
        count: { type: Number, required: true },
        windowEnd: { type: Date, required: true },
      },
      { ...opts, collection: "login_throttle" }
    )
  )

  return { User, Session, Role, AuditLog, Throttle }
}

export type Models = ReturnType<typeof createModels>
