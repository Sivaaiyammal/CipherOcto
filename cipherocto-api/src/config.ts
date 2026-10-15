/**
 * Environment configuration.
 *
 * `@fastify/env` validates and coerces `process.env` against `envSchema`; `toConfig`
 * turns that into the typed, derived `Config` the rest of the app uses and applies
 * the cross-field safety rules (no demo login in production, etc.).
 */

export const envSchema = {
  type: "object",
  required: ["MONGODB_URI"],
  properties: {
    NODE_ENV: { type: "string", enum: ["development", "test", "production"], default: "development" },
    PORT: { type: "integer", minimum: 1, maximum: 65535, default: 4000 },
    HOST: { type: "string", default: "127.0.0.1" },
    /** Connection string. Credentials live here, so it is never logged. */
    MONGODB_URI: { type: "string", minLength: 1 },
    /** CipherOcto's own database, independent of any database named in the URI. */
    MONGODB_DB: { type: "string", default: "cipherocto" },
    /** Comma-separated browser origins allowed to call the API with credentials. */
    WEB_ORIGINS: { type: "string", default: "http://localhost:5173,http://localhost:4173" },
    TRUST_PROXY: { type: "boolean", default: false },
    COOKIE_SECURE: { type: "boolean" },
    SESSION_TTL_HOURS: { type: "number", exclusiveMinimum: 0, default: 12 },
    REMEMBER_TTL_DAYS: { type: "number", exclusiveMinimum: 0, default: 30 },
    LOGIN_MAX_ATTEMPTS: { type: "integer", minimum: 1, default: 5 },
    LOGIN_WINDOW_MINUTES: { type: "number", exclusiveMinimum: 0, default: 15 },
    /** One-click demo accounts, one per role. Never allowed in production. */
    DEMO_LOGIN: { type: "boolean" },
    /** Serve OpenAPI docs at /api/v1/docs. Off by default in production. */
    API_DOCS: { type: "boolean" },
    /**
     * 32 random bytes, base64. Encrypts stored purchase tokens at rest. Generate with:
     *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     * Losing it makes stored tokens unreadable (reconciliation then needs a fresh sync).
     */
    PURCHASE_TOKEN_KEY: { type: "string" },
    /** Google Play Developer API service account: the JSON, or the JSON base64-encoded. */
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: { type: "string" },
    /** Pub/Sub push subscription URL; the OIDC token's audience must equal it. */
    RTDN_AUDIENCE: { type: "string" },
    /** Service account the Pub/Sub push subscription authenticates as. */
    RTDN_SERVICE_ACCOUNT_EMAIL: { type: "string" },
    /** How often to re-verify stale purchases against Google. 0 disables the scheduler. */
    RECONCILE_INTERVAL_MINUTES: { type: "number", minimum: 0, default: 60 },
    SEED_ADMIN_EMAIL: { type: "string" },
    SEED_ADMIN_PASSWORD: { type: "string" },
    SEED_ADMIN_NAME: { type: "string", default: "Workspace Admin" },
  },
} as const

export type RawEnv = {
  NODE_ENV: "development" | "test" | "production"
  PORT: number
  HOST: string
  MONGODB_URI: string
  MONGODB_DB: string
  WEB_ORIGINS: string
  TRUST_PROXY: boolean
  COOKIE_SECURE?: boolean
  SESSION_TTL_HOURS: number
  REMEMBER_TTL_DAYS: number
  LOGIN_MAX_ATTEMPTS: number
  LOGIN_WINDOW_MINUTES: number
  DEMO_LOGIN?: boolean
  API_DOCS?: boolean
  PURCHASE_TOKEN_KEY?: string
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?: string
  RTDN_AUDIENCE?: string
  RTDN_SERVICE_ACCOUNT_EMAIL?: string
  RECONCILE_INTERVAL_MINUTES: number
  SEED_ADMIN_EMAIL?: string
  SEED_ADMIN_PASSWORD?: string
  SEED_ADMIN_NAME: string
}

export type Config = {
  env: "development" | "test" | "production"
  port: number
  host: string
  mongoUri: string
  mongoDb: string
  webOrigins: string[]
  trustProxy: boolean
  cookieSecure: boolean
  sessionTtlMs: number
  rememberTtlMs: number
  loginMaxAttempts: number
  loginWindowMs: number
  demoLogin: boolean
  docsEnabled: boolean
  /** Raw 32-byte key for encrypting purchase tokens. */
  purchaseTokenKey: Buffer
  /** Null until a Play service account is configured; verification then answers 503. */
  googleServiceAccount: Record<string, unknown> | null
  /** Null until both values are set; the webhook then answers 503 instead of accepting pushes. */
  rtdn: { audience: string; serviceAccountEmail: string } | null
  reconcileIntervalMs: number
  seedAdmin: { email: string; password: string; name: string } | null
}

export function toConfig(e: RawEnv): Config {
  const production = e.NODE_ENV === "production"
  const demoLogin = e.DEMO_LOGIN ?? !production

  if (production && demoLogin) {
    throw new Error("DEMO_LOGIN must be off in production: it signs anyone in without a password.")
  }
  if (Boolean(e.SEED_ADMIN_EMAIL) !== Boolean(e.SEED_ADMIN_PASSWORD)) {
    throw new Error("Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or neither.")
  }
  if (e.SEED_ADMIN_PASSWORD && e.SEED_ADMIN_PASSWORD.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.")
  }

  if (!e.PURCHASE_TOKEN_KEY) {
    throw new Error("PURCHASE_TOKEN_KEY is required (32 random bytes, base64). See .env.example.")
  }
  const purchaseTokenKey = Buffer.from(e.PURCHASE_TOKEN_KEY, "base64")
  if (purchaseTokenKey.length !== 32) {
    throw new Error("PURCHASE_TOKEN_KEY must decode to exactly 32 bytes.")
  }

  let googleServiceAccount: Record<string, unknown> | null = null
  if (e.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    const raw = e.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.trim()
    try {
      googleServiceAccount = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"))
    } catch {
      // Never echo the value: it contains a private key.
      throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON (or base64 JSON).")
    }
  }

  if (Boolean(e.RTDN_AUDIENCE) !== Boolean(e.RTDN_SERVICE_ACCOUNT_EMAIL)) {
    throw new Error("Set both RTDN_AUDIENCE and RTDN_SERVICE_ACCOUNT_EMAIL, or neither.")
  }

  return {
    env: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    mongoUri: e.MONGODB_URI,
    mongoDb: e.MONGODB_DB,
    webOrigins: e.WEB_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
    trustProxy: e.TRUST_PROXY,
    cookieSecure: e.COOKIE_SECURE ?? production,
    sessionTtlMs: e.SESSION_TTL_HOURS * 3_600_000,
    rememberTtlMs: e.REMEMBER_TTL_DAYS * 86_400_000,
    loginMaxAttempts: e.LOGIN_MAX_ATTEMPTS,
    loginWindowMs: e.LOGIN_WINDOW_MINUTES * 60_000,
    demoLogin,
    docsEnabled: e.API_DOCS ?? !production,
    purchaseTokenKey,
    googleServiceAccount,
    rtdn:
      e.RTDN_AUDIENCE && e.RTDN_SERVICE_ACCOUNT_EMAIL
        ? { audience: e.RTDN_AUDIENCE, serviceAccountEmail: e.RTDN_SERVICE_ACCOUNT_EMAIL }
        : null,
    reconcileIntervalMs: e.RECONCILE_INTERVAL_MINUTES * 60_000,
    seedAdmin:
      e.SEED_ADMIN_EMAIL && e.SEED_ADMIN_PASSWORD
        ? { email: e.SEED_ADMIN_EMAIL.trim().toLowerCase(), password: e.SEED_ADMIN_PASSWORD, name: e.SEED_ADMIN_NAME }
        : null,
  }
}
