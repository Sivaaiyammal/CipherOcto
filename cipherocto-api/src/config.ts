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
    seedAdmin:
      e.SEED_ADMIN_EMAIL && e.SEED_ADMIN_PASSWORD
        ? { email: e.SEED_ADMIN_EMAIL.trim().toLowerCase(), password: e.SEED_ADMIN_PASSWORD, name: e.SEED_ADMIN_NAME }
        : null,
  }
}
