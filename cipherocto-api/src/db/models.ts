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

  // ── App portfolio ──────────────────────────────────────────────────────
  const App = conn.model(
    "App",
    new Schema(
      {
        name: { type: String, required: true, trim: true },
        packageName: { type: String, required: true, trim: true },
        /** Public URL segment (`/<slug>/privacy`). Unique; reserved words are refused. */
        slug: { type: String, trim: true, lowercase: true },
        platform: { type: String, enum: ["android"], default: "android" },
        status: {
          type: String,
          enum: ["development", "testing", "production", "maintenance", "archived"],
          default: "development",
        },
        owner: { type: String, default: "" },
        techStack: { type: String, default: "" },
        playConsoleUrl: { type: String, default: "" },
      },
      { ...opts, timestamps: true, collection: "apps" }
    )
  )

  // The SDK key's SHA-256 is the _id, so a leaked database can't be used to call the API.
  const SdkKey = conn.model(
    "SdkKey",
    new Schema(
      {
        _id: { type: String },
        appId: { type: Schema.Types.ObjectId, required: true },
        prefix: { type: String, required: true },
        label: { type: String, default: "" },
        createdBy: { type: String, default: null },
        lastUsedAt: { type: Date, default: null },
        revokedAt: { type: Date, default: null },
      },
      { ...opts, timestamps: { createdAt: true, updatedAt: false }, collection: "app_sdk_keys" }
    )
  )

  // ── Subscriptions ──────────────────────────────────────────────────────
  const Product = conn.model(
    "SubscriptionProduct",
    new Schema(
      {
        appId: { type: Schema.Types.ObjectId, required: true },
        /** The Play Console subscription id. CipherOcto maps it; it never creates it. */
        productId: { type: String, required: true, trim: true },
        entitlement: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
      },
      { ...opts, timestamps: true, collection: "subscription_products" }
    )
  )

  const Purchase = conn.model(
    "PurchaseRecord",
    new Schema(
      {
        appId: { type: Schema.Types.ObjectId, required: true },
        subjectId: { type: String, required: true },
        productId: { type: String, required: true },
        /** SHA-256 of the purchase token: the lookup key. The token itself is never a public id. */
        tokenHash: { type: String, required: true },
        /** AES-256-GCM ciphertext, kept only so reconciliation can re-query Google. */
        tokenCipher: { type: String, required: true },
        state: {
          type: String,
          enum: ["pending", "active", "canceled", "grace", "on_hold", "paused", "expired", "revoked"],
          required: true,
        },
        playState: { type: String, default: "" },
        expiresAt: { type: Date, default: null },
        autoRenewing: { type: Boolean, default: false },
        acknowledged: { type: Boolean, default: false },
        orderId: { type: String, default: null },
        obfuscatedAccountId: { type: String, default: null },
        testPurchase: { type: Boolean, default: false },
        lastVerifiedAt: { type: Date, required: true },
      },
      { ...opts, timestamps: true, collection: "purchase_records" }
    )
  )

  const Entitlement = conn.model(
    "Entitlement",
    new Schema(
      {
        appId: { type: Schema.Types.ObjectId, required: true },
        subjectId: { type: String, required: true },
        key: { type: String, required: true },
        active: { type: Boolean, required: true },
        expiresAt: { type: Date, default: null },
        purchaseId: { type: Schema.Types.ObjectId, default: null },
      },
      { ...opts, timestamps: true, collection: "entitlements" }
    )
  )

  const SubscriptionEvent = conn.model(
    "SubscriptionEvent",
    new Schema(
      {
        appId: { type: Schema.Types.ObjectId, required: true },
        purchaseId: { type: Schema.Types.ObjectId, default: null },
        subjectId: { type: String, default: null },
        type: { type: String, required: true },
        source: { type: String, enum: ["sdk", "rtdn", "reconcile", "admin"], required: true },
        /** Pub/Sub messageId: a unique index on it makes redelivery a no-op. */
        providerEventId: { type: String, default: null },
        at: { type: Date, required: true },
        detail: { type: Schema.Types.Mixed, default: null },
      },
      { ...opts, collection: "subscription_events" }
    )
  )

  // ── Public policy pages ────────────────────────────────────────────────
  // One document per published version; the highest `version` is what's served.
  // `html` is the sanitized fragment, so what's stored is exactly what's rendered.
  const AppPolicy = conn.model(
    "AppPolicy",
    new Schema(
      {
        appId: { type: Schema.Types.ObjectId, required: true },
        kind: { type: String, enum: ["privacy"], required: true },
        version: { type: Number, required: true },
        html: { type: String, required: true },
        publishedBy: { type: String, default: null },
        publishedByEmail: { type: String, default: null },
      },
      { ...opts, timestamps: { createdAt: true, updatedAt: false }, collection: "app_policies" }
    )
  )

  return { User, Session, Role, AuditLog, Throttle, App, SdkKey, Product, Purchase, Entitlement, SubscriptionEvent, AppPolicy }
}

export type Models = ReturnType<typeof createModels>
