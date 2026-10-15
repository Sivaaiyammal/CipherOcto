import { describe, expect, test } from "vitest"

import { toConfig, type RawEnv } from "../src/config.ts"
import { API, ORIGIN, PASSWORD, setup } from "./helpers.ts"

const rawEnv = (over: Partial<RawEnv> = {}): RawEnv => ({
  NODE_ENV: "production",
  PORT: 4000,
  HOST: "127.0.0.1",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DB: "cipherocto",
  WEB_ORIGINS: "https://app.example.com",
  TRUST_PROXY: false,
  SESSION_TTL_HOURS: 12,
  REMEMBER_TTL_DAYS: 30,
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  RECONCILE_INTERVAL_MINUTES: 60,
  PURCHASE_TOKEN_KEY: Buffer.alloc(32, 1).toString("base64"),
  SEED_ADMIN_NAME: "Admin",
  ...over,
})

describe("login", () => {
  test("sets an HttpOnly session cookie and returns role + permissions, never the hash", async () => {
    const t = await setup()
    const user = await t.addUser("finance")
    const { res, cookie } = await t.login(user.email)

    expect(res.statusCode).toBe(200)
    const set = res.cookies.find((c) => c.name === "octo_session")!
    expect(set.httpOnly).toBe(true)
    expect(set.sameSite).toBe("Lax")
    expect(cookie).toBeTruthy()

    const body = res.json()
    expect(body.user.email).toBe(user.email)
    expect(body.user.role.id).toBe("finance")
    expect(body.user.permissions).toContain("finance:read")
    expect(body.user.permissions).not.toContain("team:manage")
    expect(res.body).not.toContain("scrypt$")
    expect(body.user.passwordHash).toBeUndefined()
  })

  test("wrong password and unknown email are indistinguishable", async () => {
    const t = await setup()
    const user = await t.addUser("dev")

    const wrongPw = await t.login(user.email, "not-the-password")
    const unknown = await t.login("nobody@example.com", PASSWORD)

    expect(wrongPw.res.statusCode).toBe(401)
    expect(unknown.res.statusCode).toBe(401)
    const strip = (r: { json: () => Record<string, unknown> }) => ({ ...r.json(), requestId: undefined })
    expect(strip(wrongPw.res)).toEqual(strip(unknown.res))
    expect(wrongPw.cookie).toBeNull()
  })

  test("email lookup is case-insensitive", async () => {
    const t = await setup()
    await t.addUser("dev", "Mixed.Case@Example.com")
    expect((await t.login("MIXED.case@example.COM")).res.statusCode).toBe(200)
  })

  test("repeated failures lock the account out, even for the right password", async () => {
    const t = await setup({ LOGIN_MAX_ATTEMPTS: "3" })
    const user = await t.addUser("dev")

    for (let i = 0; i < 3; i++) expect((await t.login(user.email, "bad-password-1")).res.statusCode).toBe(401)

    const blocked = await t.login(user.email, PASSWORD)
    expect(blocked.res.statusCode).toBe(429)
    expect(Number(blocked.res.headers["retry-after"])).toBeGreaterThan(0)
    expect(blocked.cookie).toBeNull()
  })

  test("unknown emails are throttled too, so lockout can't reveal which accounts exist", async () => {
    const t = await setup({ LOGIN_MAX_ATTEMPTS: "3" })
    for (let i = 0; i < 3; i++) await t.login("ghost@example.com", "bad-password-1")
    expect((await t.login("ghost@example.com", "bad-password-1")).res.statusCode).toBe(429)
  })

  test("a successful login clears the failure counter", async () => {
    const t = await setup({ LOGIN_MAX_ATTEMPTS: "3" })
    const user = await t.addUser("dev")
    await t.login(user.email, "bad-password-1")
    await t.login(user.email, "bad-password-1")
    expect((await t.login(user.email)).res.statusCode).toBe(200)
    await t.login(user.email, "bad-password-1")
    await t.login(user.email, "bad-password-1")
    expect((await t.login(user.email)).res.statusCode).toBe(200)
  })

  test("'remember me' controls cookie persistence", async () => {
    const t = await setup()
    const user = await t.addUser("dev")
    const short = await t.login(user.email, PASSWORD, false)
    const long = await t.login(user.email, PASSWORD, true)
    expect(short.res.cookies.find((c) => c.name === "octo_session")!.maxAge).toBeUndefined()
    expect(long.res.cookies.find((c) => c.name === "octo_session")!.maxAge ?? 0).toBeGreaterThan(86_400)
  })

  test("malformed bodies get a 400 with the shared error shape", async () => {
    const t = await setup()
    const res = await t.app.inject({ method: "POST", url: `${API}/auth/login`, payload: { email: "nope" }, headers: { origin: ORIGIN } })
    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(body.error).toBe("validation_error")
    expect(body.requestId).toBeTruthy()
    expect(Array.isArray(body.issues)).toBe(true)
  })
})

describe("sessions", () => {
  test("/me needs a session; logout revokes it server-side", async () => {
    const t = await setup()
    const { cookie } = await t.as("analyst")

    expect((await t.get("/auth/me")).statusCode).toBe(401)
    expect((await t.get("/auth/me", cookie)).statusCode).toBe(200)

    expect((await t.post("/auth/logout", cookie)).statusCode).toBe(204)
    // A stolen copy of the cookie must be dead too.
    expect((await t.get("/auth/me", cookie)).statusCode).toBe(401)
  })

  test("suspended accounts can't sign in and lose live sessions", async () => {
    const t = await setup()
    const { user, cookie } = await t.as("dev")
    await t.users.update(user.id, { status: "suspended" })

    expect((await t.get("/auth/me", cookie)).statusCode).toBe(401)
    const attempt = await t.login(user.email)
    expect(attempt.res.statusCode).toBe(403)
    expect(attempt.res.json().error).toBe("account_suspended")
  })

  test("expired sessions are rejected", async () => {
    const t = await setup()
    const { cookie } = await t.as("dev")
    await t.app.db.models.Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await t.get("/auth/me", cookie)).statusCode).toBe(401)
  })

  test("cross-origin writes are blocked", async () => {
    const t = await setup()
    const user = await t.addUser("dev")
    const res = await t.app.inject({
      method: "POST",
      url: `${API}/auth/login`,
      payload: { email: user.email, password: PASSWORD },
      headers: { origin: "https://evil.example" },
    })
    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe("origin_not_allowed")
  })

  test("change password checks the current one, ends other sessions and keeps this one", async () => {
    const t = await setup()
    const user = await t.addUser("dev")
    const a = (await t.login(user.email)).cookie!
    const b = (await t.login(user.email)).cookie!

    const bad = await t.post("/auth/change-password", a, { currentPassword: "wrong-password!", newPassword: "a-new-long-password" })
    expect(bad.statusCode).toBe(400)

    const ok = await t.post("/auth/change-password", a, { currentPassword: PASSWORD, newPassword: "a-new-long-password" })
    expect(ok.statusCode).toBe(204)
    expect((await t.get("/auth/me", a)).statusCode).toBe(200)
    expect((await t.get("/auth/me", b)).statusCode).toBe(401)
    expect((await t.login(user.email, PASSWORD)).res.statusCode).toBe(401)
    expect((await t.login(user.email, "a-new-long-password")).res.statusCode).toBe(200)
  })
})

describe("demo login", () => {
  test("signs in as a role only when enabled, and demo accounts have no usable password", async () => {
    const on = await setup({}, { demo: true })
    const cfg = (await on.get("/auth/config")).json()
    expect(cfg.demoLogin).toBe(true)
    expect(cfg.demoRoles).toHaveLength(6)

    const res = await on.post("/auth/demo", null, { role: "analyst" })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.role.id).toBe("analyst")
    expect((await on.login("demo.analyst@cipherocto.app", PASSWORD)).res.statusCode).toBe(401)

    const off = await setup({}, { demo: false })
    expect((await off.post("/auth/demo", null, { role: "admin" })).statusCode).toBe(404)
    expect((await off.get("/auth/config")).json().demoLogin).toBe(false)
  })
})

describe("configuration", () => {
  test("production refuses demo login and defaults to secure cookies", () => {
    expect(() => toConfig(rawEnv({ DEMO_LOGIN: true }))).toThrow(/DEMO_LOGIN/)
    expect(toConfig(rawEnv()).cookieSecure).toBe(true)
    expect(toConfig(rawEnv()).demoLogin).toBe(false)
    expect(toConfig(rawEnv()).docsEnabled).toBe(false)
  })

  test("seed admin needs both email and a long password", () => {
    expect(() => toConfig(rawEnv({ SEED_ADMIN_EMAIL: "a@b.co" }))).toThrow(/both/)
    expect(() => toConfig(rawEnv({ SEED_ADMIN_EMAIL: "a@b.co", SEED_ADMIN_PASSWORD: "short" }))).toThrow(/10 characters/)
  })
})

describe("platform", () => {
  test("health is public and migrations created the indexes the design relies on", async () => {
    const t = await setup()
    expect((await t.get("/health")).json()).toEqual({ ok: true })

    const userIndexes = (await t.app.db.models.User.collection.indexes()).map((i) => i.name)
    expect(userIndexes).toContain("users_email_unique")
    const sessionIndexes = await t.app.db.models.Session.collection.indexes()
    expect(sessionIndexes.find((i) => i.name === "sessions_ttl")?.expireAfterSeconds).toBe(0)
  })

  test("OpenAPI is generated from the route schemas", async () => {
    const t = await setup()
    const spec = (await t.app.inject({ method: "GET", url: `${API}/docs/json` })).json()
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([`${API}/auth/login`, `${API}/auth/me`, `${API}/admin/users`, `${API}/admin/audit`])
    )
  })

  test("unknown routes return the shared 404 shape", async () => {
    const t = await setup()
    const res = await t.get("/nope")
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe("not_found")
  })
})
