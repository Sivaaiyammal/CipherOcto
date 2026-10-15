import { describe, expect, test } from "vitest"

import { ROLE_DEFINITIONS, type RoleId } from "../src/modules/access/permissions.ts"
import { PASSWORD, setup } from "./helpers.ts"

describe("route guards", () => {
  test("every admin route rejects anonymous callers with 401", async () => {
    const t = await setup()
    for (const url of ["/admin/users", "/admin/roles", "/admin/audit", "/auth/me"]) {
      expect((await t.get(url)).statusCode, url).toBe(401)
    }
    expect((await t.post("/admin/users", null, {})).statusCode).toBe(401)
  })

  test("role permissions gate the admin routes exactly as defined", async () => {
    const t = await setup()
    for (const role of ROLE_DEFINITIONS) {
      const { cookie } = await t.as(role.id)
      const allowed = (perm: string) => role.permissions.includes(perm as never)

      expect((await t.get("/admin/users", cookie)).statusCode, `${role.id} GET users`).toBe(allowed("team:read") ? 200 : 403)
      expect((await t.get("/admin/roles", cookie)).statusCode, `${role.id} GET roles`).toBe(allowed("team:read") ? 200 : 403)
      expect((await t.get("/admin/audit", cookie)).statusCode, `${role.id} GET audit`).toBe(allowed("audit:read") ? 200 : 403)

      const create = await t.post("/admin/users", cookie, {
        email: `n-${role.id}@example.com`,
        name: "N",
        roleId: "analyst",
        password: "a-long-enough-pass",
      })
      expect(create.statusCode, `${role.id} POST users`).toBe(allowed("team:manage") ? 201 : 403)
    }
  })

  test("a 403 names what was missing", async () => {
    const t = await setup()
    const { cookie } = await t.as("analyst")
    const res = await t.get("/admin/users", cookie)
    expect(res.json()).toMatchObject({ error: "forbidden", required: ["team:read"] })
  })

  test("/me reports the permissions the database grants", async () => {
    const t = await setup()
    for (const role of ROLE_DEFINITIONS) {
      const { cookie } = await t.as(role.id)
      const me = (await t.get("/auth/me", cookie)).json().user
      expect(me.permissions, role.id).toEqual([...role.permissions].sort())
    }
  })

  test("the sensitive permissions stay narrow", () => {
    const holders = (perm: string) => ROLE_DEFINITIONS.filter((r) => r.permissions.includes(perm as never)).map((r) => r.id)
    expect(holders("team:manage")).toEqual(["admin"])
    expect(holders("settings:manage")).toEqual(["admin"])
    expect(holders("audit:read").sort()).toEqual(["admin", "analyst"])
    // Engineers must not see company money or salaries just for being engineers.
    expect(holders("finance:read").sort()).toEqual(["admin", "finance"])
    expect(holders("finance:read")).not.toContain("analyst" as RoleId)
  })
})

describe("user administration", () => {
  test("an admin creates a user who then signs in with the assigned role; the hash never leaks", async () => {
    const t = await setup()
    const { cookie } = await t.as("admin")
    const created = await t.post("/admin/users", cookie, {
      email: "New.Person@Example.com",
      name: "New Person",
      roleId: "product",
      password: "a-long-enough-pass",
    })
    expect(created.statusCode).toBe(201)
    expect(created.json().user).toMatchObject({ email: "new.person@example.com", role: { id: "product" } })
    expect(created.body).not.toContain("scrypt$")

    const dup = await t.post("/admin/users", cookie, { email: "new.person@example.com", name: "Dup", roleId: "dev", password: "a-long-enough-pass" })
    expect(dup.statusCode).toBe(409)

    const signedIn = await t.login("new.person@example.com", "a-long-enough-pass")
    expect(signedIn.res.statusCode).toBe(200)
    expect(signedIn.res.json().user.role.id).toBe("product")

    const list = await t.get("/admin/users", cookie)
    expect(list.body).not.toContain("scrypt$")
  })

  test("two simultaneous creates of the same email give one 201 and one 409, not a 500", async () => {
    const t = await setup()
    const { cookie } = await t.as("admin")
    const body = { email: "race@example.com", name: "Race", roleId: "dev", password: "a-long-enough-pass" }
    const [a, b] = await Promise.all([t.post("/admin/users", cookie, body), t.post("/admin/users", cookie, body)])
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409])
  })

  test("an admin can't change their own role or status", async () => {
    const t = await setup()
    const { user, cookie } = await t.as("admin")
    const res = await t.patch(`/admin/users/${user.id}`, cookie, { roleId: "analyst" })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe("self_change")
  })

  test("the last active admin can't be demoted or suspended", async () => {
    // A demo admin holds team:manage but isn't counted as a real admin, so it's
    // exactly the case where the guard has to protect the only real one.
    const t = await setup({}, { demo: true })
    const demo = await t.post("/auth/demo", null, { role: "admin" })
    const demoCookie = `octo_session=${demo.cookies.find((c) => c.name === "octo_session")!.value}`
    const onlyAdmin = await t.addUser("admin")

    const demote = await t.patch(`/admin/users/${onlyAdmin.id}`, demoCookie, { roleId: "dev" })
    expect(demote.statusCode).toBe(409)
    expect(demote.json().error).toBe("last_admin")
    expect((await t.patch(`/admin/users/${onlyAdmin.id}`, demoCookie, { status: "suspended" })).statusCode).toBe(409)

    await t.addUser("admin")
    expect((await t.patch(`/admin/users/${onlyAdmin.id}`, demoCookie, { roleId: "dev" })).statusCode).toBe(200)
  })

  test("changing a role ends the target's sessions immediately", async () => {
    const t = await setup()
    const admin = await t.as("admin")
    const target = await t.as("dev")

    expect((await t.get("/auth/me", target.cookie)).statusCode).toBe(200)
    expect((await t.patch(`/admin/users/${target.user.id}`, admin.cookie, { roleId: "analyst" })).statusCode).toBe(200)
    expect((await t.get("/auth/me", target.cookie)).statusCode).toBe(401)

    const again = await t.login(target.user.email, PASSWORD)
    expect(again.res.json().user.role.id).toBe("analyst")
  })

  test("sensitive actions are written to the audit log with the actor", async () => {
    const t = await setup()
    const admin = await t.as("admin")
    const target = await t.as("dev")
    await t.patch(`/admin/users/${target.user.id}`, admin.cookie, { roleId: "finance" })

    const events = (await t.get("/admin/audit", admin.cookie)).json().events as { action: string; target: string; actorEmail: string }[]
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "user.updated", target: target.user.email, actorEmail: admin.user.email }),
        expect.objectContaining({ action: "auth.login" }),
      ])
    )
  })

  test("unknown roles, users and empty patches are rejected cleanly", async () => {
    const t = await setup()
    const { cookie } = await t.as("admin")
    const target = await t.addUser("dev")
    expect((await t.patch(`/admin/users/${target.id}`, cookie, { roleId: "root" })).statusCode).toBe(400)
    expect((await t.patch("/admin/users/does-not-exist", cookie, { roleId: "dev" })).statusCode).toBe(404)
    expect((await t.patch(`/admin/users/${target.id}`, cookie, {})).statusCode).toBe(400)
  })
})
