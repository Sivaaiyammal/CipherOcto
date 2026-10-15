import { createHash } from "node:crypto"

import { describe, expect, test } from "vitest"

import { setup, API } from "./helpers.ts"

describe("app registry", () => {
  test("registers an app and rejects a duplicate or malformed package name", async () => {
    const t = await setup()
    const { cookie } = await t.as("dev") // dev holds apps:write

    const ok = await t.post("/admin/apps", cookie, { name: "QR Scanner", packageName: "com.octo.qr" })
    expect(ok.statusCode).toBe(201)
    expect(ok.json().app).toMatchObject({ packageName: "com.octo.qr", platform: "android", status: "development" })

    const dup = await t.post("/admin/apps", cookie, { name: "Other", packageName: "com.octo.qr" })
    expect(dup.statusCode).toBe(409)
    expect(dup.json().error).toBe("package_taken")

    const bad = await t.post("/admin/apps", cookie, { name: "Bad", packageName: "not a package" })
    expect(bad.statusCode).toBe(400)

    expect((await t.get("/admin/apps", cookie)).json().apps).toHaveLength(1)
  })

  test("roles without apps:write can read but not register", async () => {
    const t = await setup()
    const analyst = await t.as("analyst")
    expect((await t.get("/admin/apps", analyst.cookie)).statusCode).toBe(200)
    expect((await t.post("/admin/apps", analyst.cookie, { name: "X", packageName: "com.x.y" })).statusCode).toBe(403)
    expect((await t.get("/admin/apps")).statusCode).toBe(401)
  })

  test("status updates are audited", async () => {
    const t = await setup()
    const admin = await t.as("admin")
    const { app } = (await t.post("/admin/apps", admin.cookie, { name: "QR", packageName: "com.octo.qr" })).json()
    const res = await t.patch(`/admin/apps/${app.id}`, admin.cookie, { status: "production" })
    expect(res.json().app.status).toBe("production")

    const events = (await t.get("/admin/audit", admin.cookie)).json().events as { action: string }[]
    expect(events.map((e) => e.action)).toEqual(expect.arrayContaining(["app.created", "app.updated"]))
  })
})

describe("SDK keys", () => {
  async function appWithKey() {
    const t = await setup()
    const admin = await t.as("admin")
    const { app } = (await t.post("/admin/apps", admin.cookie, { name: "QR", packageName: "com.octo.qr" })).json()
    const created = (await t.post(`/admin/apps/${app.id}/sdk-keys`, admin.cookie, { label: "android" })).json()
    const sdk = (method: "GET" | "POST", url: string, key: string | null, payload?: object) =>
      t.app.inject({ method, url: `${API}${url}`, payload, headers: key ? { "x-octo-sdk-key": key } : {} })
    return { t, admin, app, created, sdk }
  }

  test("the secret is shown once, stored only as a hash, and listed by prefix", async () => {
    const { t, admin, app, created } = await appWithKey()
    expect(created.secret).toMatch(/^octo_sdk_/)
    expect(created.key.prefix).toBe(created.secret.slice(0, 15))

    const stored = await t.app.db.models.SdkKey.findOne({ appId: app.id }).lean<{ _id: string }>()
    expect(stored!._id).toBe(createHash("sha256").update(created.secret).digest("hex"))
    expect(stored!._id).not.toBe(created.secret)

    const listed = await t.get(`/admin/apps/${app.id}/sdk-keys`, admin.cookie)
    expect(listed.body).not.toContain(created.secret)
  })

  test("a valid key reaches the SDK; missing, wrong or revoked keys get 401", async () => {
    const { t, admin, app, created, sdk } = await appWithKey()

    expect((await sdk("GET", "/sdk/products", created.secret)).statusCode).toBe(200)
    expect((await sdk("GET", "/sdk/products", null)).statusCode).toBe(401)
    expect((await sdk("GET", "/sdk/products", "octo_sdk_nope")).statusCode).toBe(401)

    expect((await t.app.inject({ method: "DELETE", url: `${API}/admin/apps/${app.id}/sdk-keys/${created.key.id}`, headers: { cookie: admin.cookie, origin: "http://localhost:5173" } })).statusCode).toBe(204)
    expect((await sdk("GET", "/sdk/products", created.secret)).statusCode).toBe(401)
  })

  test("archiving an app disables its keys", async () => {
    const { t, admin, app, created, sdk } = await appWithKey()
    await t.patch(`/admin/apps/${app.id}`, admin.cookie, { status: "archived" })
    expect((await sdk("GET", "/sdk/products", created.secret)).statusCode).toBe(401)
  })

  test("a dashboard session is not accepted on SDK routes", async () => {
    const { admin, t } = await appWithKey()
    expect((await t.get("/sdk/products", admin.cookie)).statusCode).toBe(401)
  })
})
