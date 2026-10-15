import { describe, expect, test } from "vitest"

import { API, ORIGIN, setup } from "./helpers.ts"

type T = Awaited<ReturnType<typeof setup>>

const put = (t: T, appId: string, cookie: string | null, html: unknown) =>
  t.app.inject({
    method: "PUT",
    url: `${API}/admin/apps/${appId}/policies/privacy`,
    payload: { html },
    headers: { ...(cookie ? { cookie } : {}), origin: ORIGIN },
  })

async function appWithAdmin(name = "Ray Call", packageName = "com.octo.raycall") {
  const t = await setup()
  const admin = await t.as("admin")
  const { app } = (await t.post("/admin/apps", admin.cookie, { name, packageName })).json()
  return { t, admin, app }
}

describe("app slugs", () => {
  test("derives a slug from the name, de-duplicates, and lets it be edited", async () => {
    const { t, admin, app } = await appWithAdmin()
    expect(app.slug).toBe("ray-call")

    const twin = (await t.post("/admin/apps", admin.cookie, { name: "Ray Call", packageName: "com.octo.raycall2" })).json().app
    expect(twin.slug).toBe("ray-call-2")

    const renamed = await t.patch(`/admin/apps/${app.id}`, admin.cookie, { slug: "raycall" })
    expect(renamed.json().app.slug).toBe("raycall")

    const taken = await t.patch(`/admin/apps/${twin.id}`, admin.cookie, { slug: "raycall" })
    expect(taken.statusCode).toBe(409)
    expect(taken.json().error).toBe("slug_taken")
  })

  test("refuses reserved and malformed slugs", async () => {
    const { t, admin, app } = await appWithAdmin()
    for (const slug of ["api", "login", "apps"]) {
      const res = await t.patch(`/admin/apps/${app.id}`, admin.cookie, { slug })
      expect(res.statusCode, slug).toBe(400)
      expect(res.json().error).toBe("reserved_slug")
    }
    for (const slug of ["-bad", "has space", "UPPER_x", "a/b"]) {
      const res = await t.patch(`/admin/apps/${app.id}`, admin.cookie, { slug })
      expect(res.statusCode, slug).toBe(400)
    }
  })

  test("a reserved name in an app title still gets a usable slug", async () => {
    const { t, admin } = await appWithAdmin("Admin", "com.octo.admin")
    const apps = (await t.get("/admin/apps", admin.cookie)).json().apps as { slug: string }[]
    expect(apps[0]!.slug).toBe("admin-2")
  })
})

describe("privacy policy pages", () => {
  test("a published page is served at /<slug>/privacy immediately, with no restart", async () => {
    const { t, admin, app } = await appWithAdmin()

    // Nothing published yet.
    const before = await t.app.inject({ method: "GET", url: "/ray-call/privacy" })
    expect(before.statusCode).toBe(404)
    expect(before.headers["content-type"]).toContain("text/html")

    const res = await put(t, app.id, admin.cookie, "<h1>Ray Call Privacy</h1><p>We collect nothing.</p>")
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ unchanged: false, publicPath: "/ray-call/privacy", policy: { version: 1 } })

    const page = await t.app.inject({ method: "GET", url: "/ray-call/privacy" })
    expect(page.statusCode).toBe(200)
    expect(page.headers["content-type"]).toContain("text/html")
    expect(page.body).toContain("<h1>Ray Call Privacy</h1>")
    expect(page.body).toContain("<title>Ray Call — Privacy Policy</title>")
    expect(page.headers["content-security-policy"]).toContain("default-src 'none'")

    // Publishing again replaces it on the very next request.
    await put(t, app.id, admin.cookie, "<h1>Version two</h1>")
    expect((await t.app.inject({ method: "GET", url: "/ray-call/privacy" })).body).toContain("Version two")
  })

  test("is public (no sign-in) and unknown slugs get a 404 page", async () => {
    const { t, admin, app } = await appWithAdmin()
    await put(t, app.id, admin.cookie, "<p>Policy</p>")
    expect((await t.app.inject({ method: "GET", url: "/ray-call/privacy" })).statusCode).toBe(200)
    expect((await t.app.inject({ method: "GET", url: "/nope/privacy" })).statusCode).toBe(404)
    expect((await t.app.inject({ method: "GET", url: "/BAD_SLUG!/privacy" })).statusCode).toBe(404)
  })

  test("renaming the slug moves the page", async () => {
    const { t, admin, app } = await appWithAdmin()
    await put(t, app.id, admin.cookie, "<p>Policy</p>")
    await t.patch(`/admin/apps/${app.id}`, admin.cookie, { slug: "raycall" })
    expect((await t.app.inject({ method: "GET", url: "/raycall/privacy" })).statusCode).toBe(200)
    expect((await t.app.inject({ method: "GET", url: "/ray-call/privacy" })).statusCode).toBe(404)
  })

  test("strips scripts, handlers, javascript: links, iframes, forms and remote CSS", async () => {
    const { t, admin, app } = await appWithAdmin()
    const evil =
      `<style>@import url(https://evil.test/x.css);p{background:url(https://evil.test/p.png);color:#333}</style>` +
      `<h1 onclick="alert(1)">Title</h1><script>alert('xss')</script>` +
      `<a href="javascript:alert(1)">bad</a><a href="https://ok.test/p" target="_blank">ok</a>` +
      `<iframe src="https://evil.test"></iframe><form action="https://evil.test"><input name=a></form>` +
      `<img src="x" onerror="alert(1)"><img src="https://ok.test/logo.png" alt="logo">` +
      `<p style="color:red;background:url(javascript:alert(1))">styled</p>`
    const res = await put(t, app.id, admin.cookie, evil)
    expect(res.statusCode).toBe(200)
    const html = res.json().policy.html as string

    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/alert\(/)
    expect(html).not.toMatch(/onclick|onerror/i)
    expect(html).not.toMatch(/javascript:/i)
    expect(html).not.toMatch(/<iframe|<form|<input/i)
    expect(html).not.toMatch(/@import/i)
    expect(html).not.toMatch(/url\(/i)
    expect(html).not.toContain('src="x"')
    // Legitimate content survives.
    expect(html).toContain("<h1>Title</h1>")
    expect(html).toContain('href="https://ok.test/p"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
    expect(html).toContain('src="https://ok.test/logo.png"')
    expect(html).toContain("color:#333")
    expect(html).toContain("color:red")
  })

  test("escapes the app name in the page title", async () => {
    const { t, admin, app } = await appWithAdmin(`<b>"x"</b>`, "com.octo.xss")
    await put(t, app.id, admin.cookie, "<p>Policy</p>")
    const slug = (await t.get(`/admin/apps/${app.id}`, admin.cookie)).json().app.slug as string
    const page = await t.app.inject({ method: "GET", url: `/${slug}/privacy` })
    expect(page.body).toContain("<title>&lt;b&gt;&quot;x&quot;&lt;/b&gt; — Privacy Policy</title>")
  })

  test("rejects empty or script-only uploads", async () => {
    const { t, admin, app } = await appWithAdmin()
    for (const html of ["   ", "<script>alert(1)</script>", "<p>&nbsp;</p>"]) {
      const res = await put(t, app.id, admin.cookie, html)
      expect(res.statusCode, html).toBe(400)
    }
    expect((await t.app.inject({ method: "GET", url: "/ray-call/privacy" })).statusCode).toBe(404)
  })

  test("versions are kept; identical re-uploads don't create a new one", async () => {
    const { t, admin, app } = await appWithAdmin()
    await put(t, app.id, admin.cookie, "<p>one</p>")
    const same = await put(t, app.id, admin.cookie, "<p>one</p>")
    expect(same.json().unchanged).toBe(true)
    await put(t, app.id, admin.cookie, "<p>two</p>")

    const overview = (await t.get(`/admin/apps/${app.id}/policies/privacy`, admin.cookie)).json()
    expect(overview.current).toMatchObject({ version: 2, html: "<p>two</p>" })
    expect(overview.versions.map((v: { version: number }) => v.version)).toEqual([2, 1])
    expect(overview.versions[0].publishedByEmail).toBe(admin.user.email)

    const v1 = (await t.get(`/admin/apps/${app.id}/policies/privacy/versions/1`, admin.cookie)).json()
    expect(v1.policy.html).toBe("<p>one</p>")
    expect((await t.get(`/admin/apps/${app.id}/policies/privacy/versions/9`, admin.cookie)).statusCode).toBe(404)
  })

  test("publishing is audited", async () => {
    const { t, admin, app } = await appWithAdmin()
    await put(t, app.id, admin.cookie, "<p>one</p>")
    const events = (await t.get("/admin/audit", admin.cookie)).json().events as { action: string }[]
    expect(events.map((e) => e.action)).toContain("app.privacy_policy_published")
  })

  test("needs apps:write to publish, apps:read to view, and sign-in for both", async () => {
    const { t, app } = await appWithAdmin()
    const analyst = await t.as("analyst") // read-only
    const dev = await t.as("dev")

    expect((await put(t, app.id, null, "<p>x</p>")).statusCode).toBe(401)
    expect((await put(t, app.id, analyst.cookie, "<p>x</p>")).statusCode).toBe(403)
    expect((await t.get(`/admin/apps/${app.id}/policies/privacy`)).statusCode).toBe(401)
    expect((await t.get(`/admin/apps/${app.id}/policies/privacy`, analyst.cookie)).statusCode).toBe(200)
    expect((await put(t, app.id, dev.cookie, "<p>x</p>")).statusCode).toBe(200)
  })

  test("a cross-origin write is refused", async () => {
    const { t, admin, app } = await appWithAdmin()
    const res = await t.app.inject({
      method: "PUT",
      url: `${API}/admin/apps/${app.id}/policies/privacy`,
      payload: { html: "<p>x</p>" },
      headers: { cookie: admin.cookie, origin: "https://evil.test" },
    })
    expect(res.statusCode).toBe(403)
  })

  test("slug derivation falls back sensibly and skips taken or reserved names", async () => {
    const { slugBase, uniqueSlug } = await import("../src/shared/slug.ts")
    expect(uniqueSlug(slugBase("Legacy App", "com.octo.legacy"), new Set())).toBe("legacy-app")
    expect(uniqueSlug(slugBase("", "com.octo.legacy"), new Set(["legacy"]))).toBe("legacy-2")
    expect(uniqueSlug(slugBase("日本語", "com.octo.x"), new Set())).toBe("app-2") // "app" is reserved
    expect(uniqueSlug("login", new Set())).toBe("login-2")
  })
})
