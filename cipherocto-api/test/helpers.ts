import { randomUUID } from "node:crypto"

import type { FastifyInstance } from "fastify"
import { afterEach, inject } from "vitest"

import { buildApp } from "../src/app.ts"
import type { RoleId } from "../src/modules/access/permissions.ts"
import { hashPassword } from "../src/shared/crypto.ts"
import { SESSION_COOKIE } from "../src/shared/session-cookie.ts"
import { seedDatabase } from "../src/seed.ts"
import type { Overrides } from "../src/services.ts"

export const PASSWORD = "correct-horse-battery"
/** 32 zero bytes, base64 — fine for tests, never for real data. */
export const TEST_TOKEN_KEY = Buffer.alloc(32, 7).toString("base64")
export const ORIGIN = "http://localhost:5173"
export const API = "/api/v1"

const open: FastifyInstance[] = []

// Close every app a test opened so Mongo connections don't pile up.
afterEach(async () => {
  await Promise.all(open.splice(0).map((a) => a.close()))
})

export async function setup(env: Record<string, string> = {}, opts: { demo?: boolean } & Overrides = {}) {
  const app = await buildApp({
    verifier: opts.verifier,
    pushAuth: opts.pushAuth,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: inject("mongoUri"),
      MONGODB_DB: `t_${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      DEMO_LOGIN: opts.demo ? "true" : "false",
      WEB_ORIGINS: ORIGIN,
      PURCHASE_TOKEN_KEY: TEST_TOKEN_KEY,
      ...env,
    },
  })
  open.push(app)
  await seedDatabase(app.services, app.settings)

  let n = 0
  const users = app.services.repos.users

  const addUser = async (roleId: RoleId, email = `${roleId}${++n}@example.com`, password = PASSWORD) =>
    users.create({ email, name: `User ${roleId}`, roleId, passwordHash: await hashPassword(password) })

  const send = (method: "GET" | "POST" | "PATCH", url: string, cookie?: string | null, payload?: object) =>
    app.inject({ method, url: `${API}${url}`, payload, headers: { ...(cookie ? { cookie } : {}), origin: ORIGIN } })

  const login = async (email: string, password = PASSWORD, remember = false) => {
    const res = await send("POST", "/auth/login", null, { email, password, remember })
    const set = res.cookies.find((c) => c.name === SESSION_COOKIE)
    return { res, cookie: set ? `${SESSION_COOKIE}=${set.value}` : null }
  }

  /** Creates a user with `roleId` and returns them with a signed-in cookie. */
  const as = async (roleId: RoleId) => {
    const user = await addUser(roleId)
    const { cookie } = await login(user.email)
    if (!cookie) throw new Error("login failed in test setup")
    return { user, cookie }
  }

  return {
    app,
    services: app.services,
    users,
    addUser,
    login,
    as,
    get: (url: string, cookie?: string | null) => send("GET", url, cookie),
    post: (url: string, cookie: string | null, payload?: object) => send("POST", url, cookie, payload),
    patch: (url: string, cookie: string | null, payload?: object) => send("PATCH", url, cookie, payload),
  }
}
