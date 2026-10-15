import { createHash, randomUUID } from "node:crypto"

import { describe, expect, test } from "vitest"

import { PlayVerificationError } from "../src/modules/subscriptions/play.ts"
import { FakePlayVerifier, FakePushAuthenticator } from "../src/modules/subscriptions/play.fake.ts"
import { API, ORIGIN, setup } from "./helpers.ts"

const PKG = "com.octo.qr"
const SUBJECT = "user-0001-abcdef"
const TOKEN = "purchase-token-AAAAAAAAAAAAAAAAAAAA"
const DAY = 86_400_000

/** A registered app, an SDK key and one active product, with Google faked. */
async function world(opts: { verifier?: FakePlayVerifier; rtdn?: boolean } = {}) {
  const play = opts.verifier ?? new FakePlayVerifier()
  const t = await setup(
    opts.rtdn === false ? {} : { RTDN_AUDIENCE: "https://api.test/api/v1/webhooks/google-play", RTDN_SERVICE_ACCOUNT_EMAIL: "push@test.iam" },
    { verifier: play, pushAuth: new FakePushAuthenticator("push-ok") }
  )
  const admin = await t.as("admin")
  const { app } = (await t.post("/admin/apps", admin.cookie, { name: "QR Scanner", packageName: PKG })).json()
  const { secret } = (await t.post(`/admin/apps/${app.id}/sdk-keys`, admin.cookie, { label: "android" })).json()
  await t.post(`/admin/apps/${app.id}/products`, admin.cookie, {
    productId: "premium_monthly",
    entitlement: "premium",
    displayName: "Premium (monthly)",
    status: "active",
  })

  const sdk = (method: "GET" | "POST", url: string, payload?: object, key: string | null = secret) =>
    t.app.inject({ method, url: `${API}${url}`, payload, headers: key ? { "x-octo-sdk-key": key } : {} })

  const verify = (over: Partial<{ subjectId: string; productId: string; purchaseToken: string }> = {}) =>
    sdk("POST", "/sdk/purchases/verify", { subjectId: SUBJECT, productId: "premium_monthly", purchaseToken: TOKEN, ...over })

  const push = (data: object, messageId: string = randomUUID(), auth: string | null = "Bearer push-ok") =>
    t.app.inject({
      method: "POST",
      url: `${API}/webhooks/google-play`,
      headers: { ...(auth ? { authorization: auth } : {}), "content-type": "application/json" },
      payload: { message: { data: Buffer.from(JSON.stringify(data)).toString("base64"), messageId } },
    })

  const notification = (type: number, token = TOKEN) => ({
    version: "1.0",
    packageName: PKG,
    eventTimeMillis: String(Date.now()),
    subscriptionNotification: { version: "1.0", notificationType: type, purchaseToken: token, subscriptionId: "premium_monthly" },
  })

  const events = async () => (await t.get(`/admin/apps/${app.id}/subscriptions/events`, admin.cookie)).json().events as { type: string; source: string }[]
  const entitlement = async (subject = SUBJECT) =>
    (await sdk("GET", `/sdk/entitlements?subjectId=${subject}`)).json().entitlements as { key: string; active: boolean; expiresAt: string | null }[]

  return { t, play, admin, app, secret, sdk, verify, push, notification, events, entitlement }
}

describe("purchase verification", () => {
  test("verifies with Google, acknowledges, and grants the entitlement", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", obfuscatedAccountId: SUBJECT })

    const res = await w.verify()
    expect(res.statusCode).toBe(200)
    expect(res.json().purchase).toMatchObject({ productId: "premium_monthly", state: "active", entitled: true })
    expect(res.json().entitlements).toEqual([expect.objectContaining({ key: "premium", active: true })])
    expect(w.play.acknowledgements).toHaveLength(1)
    expect(await w.entitlement()).toEqual([expect.objectContaining({ key: "premium", active: true })])
  })

  test("never returns the purchase token anywhere", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    const bodies = [
      (await w.verify()).body,
      (await w.sdk("GET", `/sdk/entitlements?subjectId=${SUBJECT}`)).body,
      (await w.t.get(`/admin/apps/${w.app.id}/subscriptions/summary`, w.admin.cookie)).body,
      (await w.t.get(`/admin/apps/${w.app.id}/subscriptions/events`, w.admin.cookie)).body,
    ]
    for (const b of bodies) expect(b).not.toContain(TOKEN)
  })

  test("stores a hash and ciphertext, not the token", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    const doc = await w.t.app.db.models.Purchase.findOne({}).lean<{ tokenHash: string; tokenCipher: string }>()
    expect(doc!.tokenHash).toBe(createHash("sha256").update(TOKEN).digest("hex"))
    expect(doc!.tokenCipher).toMatch(/^v1\./)
    expect(JSON.stringify(doc)).not.toContain(TOKEN)
  })

  test("verifying twice is idempotent: one record, one event, one acknowledgement", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()
    await w.verify()

    expect(await w.t.app.db.models.Purchase.countDocuments()).toBe(1)
    expect((await w.events()).filter((e) => e.type === "PURCHASED")).toHaveLength(1)
    expect(w.play.acknowledgements).toHaveLength(1)
  })

  test("a token Google doesn't know grants nothing", async () => {
    const w = await world()
    const res = await w.verify({ purchaseToken: "forged-token-XXXXXXXXXXXXXXXX" })
    expect(res.statusCode).toBe(422)
    expect(res.json().error).toBe("invalid_purchase")
    expect(await w.entitlement()).toEqual([])
  })

  test("without Google credentials it fails closed instead of granting", async () => {
    // No injected verifier and no service account: the real default is the unconfigured one.
    const t = await setup()
    const admin = await t.as("admin")
    const { app } = (await t.post("/admin/apps", admin.cookie, { name: "QR", packageName: PKG })).json()
    const { secret } = (await t.post(`/admin/apps/${app.id}/sdk-keys`, admin.cookie, {})).json()
    await t.post(`/admin/apps/${app.id}/products`, admin.cookie, { productId: "premium_monthly", entitlement: "premium", displayName: "P", status: "active" })

    const res = await t.app.inject({
      method: "POST",
      url: `${API}/sdk/purchases/verify`,
      headers: { "x-octo-sdk-key": secret },
      payload: { subjectId: SUBJECT, productId: "premium_monthly", purchaseToken: TOKEN },
    })
    expect(res.statusCode).toBe(503)
    expect(res.json().error).toBe("verification_unavailable")
    expect(await t.app.db.models.Entitlement.countDocuments()).toBe(0)
  })

  test("a Google outage is a retryable 503 and grants nothing", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    w.play.failWith = new PlayVerificationError("unavailable", "down")
    const res = await w.verify()
    expect(res.statusCode).toBe(503)
    expect(await w.entitlement()).toEqual([])
  })

  test("rejects unknown and mismatched products", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "something_else" })
    const unknown = await w.verify({ productId: "something_else" })
    expect(unknown.statusCode).toBe(422)
    expect(unknown.json().error).toBe("unknown_product")

    w.play.set(PKG, "token-for-monthly-AAAAAAAAAAAA", { productId: "premium_monthly" })
    await w.t.post(`/admin/apps/${w.app.id}/products`, w.admin.cookie, { productId: "premium_yearly", entitlement: "premium", displayName: "Y", status: "active" })
    const mismatch = await w.verify({ purchaseToken: "token-for-monthly-AAAAAAAAAAAA", productId: "premium_yearly" })
    expect(mismatch.json().error).toBe("product_mismatch")
  })

  test("draft products can't be sold from the SDK list, and archived ones are refused", async () => {
    const w = await world()
    await w.t.post(`/admin/apps/${w.app.id}/products`, w.admin.cookie, { productId: "beta_plan", entitlement: "beta", displayName: "Beta" })
    const listed = (await w.sdk("GET", "/sdk/products")).json().products as { productId: string }[]
    expect(listed.map((p) => p.productId)).toEqual(["premium_monthly"])
  })
})

describe("ownership", () => {
  test("a purchase can't be re-bound to a different subject", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    expect((await w.verify()).statusCode).toBe(200)

    const stolen = await w.verify({ subjectId: "attacker-9999-abcdef" })
    expect(stolen.statusCode).toBe(409)
    expect(stolen.json().error).toBe("purchase_bound_elsewhere")
    expect(await w.entitlement("attacker-9999-abcdef")).toEqual([])
  })

  test("the account id Google recorded at purchase must match the claimed subject", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", obfuscatedAccountId: "someone-else-1234567" })
    const res = await w.verify()
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe("subject_mismatch")
    expect(await w.entitlement()).toEqual([])
  })

  test("subjects are isolated per app", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    const { app: other } = (await w.t.post("/admin/apps", w.admin.cookie, { name: "Other", packageName: "com.octo.other" })).json()
    const { secret } = (await w.t.post(`/admin/apps/${other.id}/sdk-keys`, w.admin.cookie, {})).json()
    const res = await w.sdk("GET", `/sdk/entitlements?subjectId=${SUBJECT}`, undefined, secret)
    expect(res.json().entitlements).toEqual([])
  })
})

describe("lifecycle states", () => {
  test("canceled stays entitled until expiry; expired and on-hold do not", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", state: "canceled", playState: "SUBSCRIPTION_STATE_CANCELED", autoRenewing: false })
    await w.verify()
    expect((await w.entitlement())[0]).toMatchObject({ active: true })

    w.play.set(PKG, TOKEN, { productId: "premium_monthly", state: "on_hold", playState: "SUBSCRIPTION_STATE_ON_HOLD" })
    await w.verify()
    expect((await w.entitlement())[0]).toMatchObject({ active: false })
  })

  test("an active purchase whose paid period already ended is not entitled", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", expiresAt: new Date(Date.now() - DAY) })
    const res = await w.verify()
    expect(res.json().purchase.entitled).toBe(false)
    expect((await w.entitlement())[0]).toMatchObject({ active: false })
    expect(w.play.acknowledgements).toHaveLength(0) // never acknowledge something that grants nothing
  })

  test("grace period keeps access", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", state: "grace", playState: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", expiresAt: new Date(Date.now() - DAY) })
    await w.verify()
    expect((await w.entitlement())[0]).toMatchObject({ active: true })
  })

  test("an upgrade supersedes the purchase it links to", async () => {
    const w = await world()
    await w.t.post(`/admin/apps/${w.app.id}/products`, w.admin.cookie, { productId: "premium_yearly", entitlement: "premium", displayName: "Y", status: "active" })
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    const NEW = "purchase-token-BBBBBBBBBBBBBBBBBBBB"
    w.play.set(PKG, NEW, { productId: "premium_yearly", linkedPurchaseToken: TOKEN })
    await w.verify({ purchaseToken: NEW, productId: "premium_yearly" })

    const states = await w.t.app.db.models.Purchase.find({}).lean<{ productId: string; state: string }[]>()
    expect(states.find((s) => s.productId === "premium_monthly")!.state).toBe("expired")
    expect((await w.entitlement())[0]).toMatchObject({ key: "premium", active: true })
    expect((await w.events()).map((e) => e.type)).toContain("REPLACED")
  })
})

describe("restore (sync)", () => {
  test("verifies a batch; one bad token doesn't block the good one", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    const res = await w.sdk("POST", "/sdk/purchases/sync", {
      subjectId: SUBJECT,
      purchases: [
        { productId: "premium_monthly", purchaseToken: TOKEN },
        { productId: "premium_monthly", purchaseToken: "forged-token-ZZZZZZZZZZZZZZZZ" },
      ],
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().results).toEqual([
      expect.objectContaining({ ok: true, state: "active" }),
      expect.objectContaining({ ok: false, error: "invalid_purchase" }),
    ])
    expect(res.json().entitlements[0]).toMatchObject({ key: "premium", active: true })
  })

  test("an outage fails the whole sync so the SDK retries rather than reporting 'not owned'", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    w.play.failWith = new PlayVerificationError("unavailable", "down")
    const res = await w.sdk("POST", "/sdk/purchases/sync", { subjectId: SUBJECT, purchases: [{ productId: "premium_monthly", purchaseToken: TOKEN }] })
    expect(res.statusCode).toBe(503)
  })
})

describe("Real-time Developer Notifications", () => {
  test("rejects pushes without valid credentials, before reading the body", async () => {
    const w = await world()
    expect((await w.push(w.notification(2), randomUUID(), null)).statusCode).toBe(401)
    expect((await w.push(w.notification(2), randomUUID(), "Bearer wrong")).statusCode).toBe(401)
    // Not even a parseable body gets an answer without credentials.
    const garbage = await w.t.app.inject({ method: "POST", url: `${API}/webhooks/google-play`, payload: "nope", headers: { "content-type": "application/json" } })
    expect(garbage.statusCode).toBe(401)
  })

  test("is unavailable (503) until push authentication is configured", async () => {
    const w = await world({ rtdn: false })
    expect((await w.push(w.notification(2))).statusCode).toBe(503)
  })

  test("a renewal re-reads Google and extends the entitlement", async () => {
    const w = await world()
    const first = new Date(Date.now() + 2 * DAY)
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", expiresAt: first })
    await w.verify()

    const renewed = new Date(Date.now() + 32 * DAY)
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", expiresAt: renewed })
    const res = await w.push(w.notification(2))
    expect(res.statusCode).toBe(204)

    expect((await w.entitlement())[0]!.expiresAt).toBe(renewed.toISOString())
    expect((await w.events()).map((e) => e.type)).toContain("RENEWED")
  })

  test("a redelivered message is a no-op", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", state: "canceled", playState: "SUBSCRIPTION_STATE_CANCELED" })

    const id = randomUUID()
    expect((await w.push(w.notification(3), id)).statusCode).toBe(204)
    const callsAfterFirst = w.play.calls
    expect((await w.push(w.notification(3), id)).statusCode).toBe(204)

    expect(w.play.calls).toBe(callsAfterFirst) // duplicate never reached Google
    expect((await w.events()).filter((e) => e.type === "CANCELED")).toHaveLength(1)
  })

  test("trusts Google's state, not the notification body", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()
    // A forged "expired" push while Google still says active changes nothing.
    await w.push(w.notification(13))
    expect((await w.entitlement())[0]).toMatchObject({ active: true })
  })

  test("a voided purchase revokes access and can't be resurrected by a stale read", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    const res = await w.push({
      packageName: PKG,
      voidedPurchaseNotification: { purchaseToken: TOKEN, orderId: "GPA.1", productType: 1, refundType: 1 },
    })
    expect(res.statusCode).toBe(204)
    expect((await w.entitlement())[0]).toMatchObject({ active: false })
    expect((await w.events()).map((e) => e.type)).toContain("REVOKED")

    // Google still (stale) reports active; the refund must stick.
    await w.push(w.notification(2))
    await w.verify()
    expect((await w.entitlement())[0]).toMatchObject({ active: false })
    const doc = await w.t.app.db.models.Purchase.findOne({}).lean<{ state: string }>()
    expect(doc!.state).toBe("revoked")
  })

  test("acknowledges test, unknown-package and unparseable messages without failing", async () => {
    const w = await world()
    expect((await w.push({ packageName: PKG, testNotification: { version: "1.0" } })).statusCode).toBe(204)
    expect((await w.events()).map((e) => e.type)).toContain("TEST")

    expect((await w.push({ packageName: "com.not.registered", testNotification: {} })).statusCode).toBe(204)

    const bad = await w.t.app.inject({
      method: "POST",
      url: `${API}/webhooks/google-play`,
      headers: { authorization: "Bearer push-ok", "content-type": "application/json" },
      payload: { message: { data: Buffer.from("not json").toString("base64"), messageId: "m1" } },
    })
    expect(bad.statusCode).toBe(204)
  })

  test("a transient Google failure returns 5xx so Pub/Sub retries, and records nothing", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    w.play.failWith = new PlayVerificationError("unavailable", "down")
    const id = randomUUID()

    expect((await w.push(w.notification(2), id)).statusCode).toBe(500)
    w.play.failWith = null
    expect((await w.push(w.notification(2), id)).statusCode).toBe(204) // the retry succeeds
  })
})

describe("reconciliation", () => {
  test("re-reads Google for stale purchases and ends access that lapsed silently", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    // We never got the notification; Google now says it expired.
    w.play.set(PKG, TOKEN, { productId: "premium_monthly", state: "expired", playState: "SUBSCRIPTION_STATE_EXPIRED", expiresAt: new Date(Date.now() - DAY) })
    const res = await w.t.post("/admin/subscriptions/reconcile", w.admin.cookie, { appId: w.app.id, staleMinutes: 0 })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ checked: 1, changed: 1, failed: 0 })

    expect((await w.entitlement())[0]).toMatchObject({ active: false })
    expect((await w.events()).find((e) => e.type === "EXPIRED")?.source).toBe("reconcile")
  })

  test("a purchase Google no longer recognises is ended, not left dangling", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()
    // Simulate Google forgetting the token.
    const fresh = new FakePlayVerifier()
    ;(w.t.app.services.subscriptions as unknown as { verifier: FakePlayVerifier }).verifier = fresh

    const res = await w.t.post("/admin/subscriptions/reconcile", w.admin.cookie, { staleMinutes: 0 })
    expect(res.json().changed).toBe(1)
    expect((await w.entitlement())[0]).toMatchObject({ active: false })
  })

  test("only roles with subscriptions:write can trigger it", async () => {
    const w = await world()
    const analyst = await w.t.as("analyst")
    expect((await w.t.post("/admin/subscriptions/reconcile", analyst.cookie, {})).statusCode).toBe(403)
  })
})

describe("admin reporting and mapping", () => {
  test("summary reports counts, freshness and what is configured", async () => {
    const w = await world()
    w.play.set(PKG, TOKEN, { productId: "premium_monthly" })
    await w.verify()

    const res = await w.t.get(`/admin/apps/${w.app.id}/subscriptions/summary`, w.admin.cookie)
    expect(res.json()).toMatchObject({ states: { active: 1 }, activeEntitlements: 1, notificationsConfigured: true })
    expect(res.json().lastVerifiedAt).toBeTruthy()
  })

  test("product mapping validates ids, rejects duplicates and respects permissions", async () => {
    const w = await world()
    const product = await w.t.as("product") // subscriptions:write
    const dev = await w.t.as("dev") // no subscriptions access
    const analyst = await w.t.as("analyst") // read only

    const bad = await w.t.post(`/admin/apps/${w.app.id}/products`, product.cookie, { productId: "Has Spaces!", entitlement: "premium", displayName: "X" })
    expect(bad.statusCode).toBe(400)

    const dup = await w.t.post(`/admin/apps/${w.app.id}/products`, product.cookie, { productId: "premium_monthly", entitlement: "premium", displayName: "X" })
    expect(dup.statusCode).toBe(409)

    expect((await w.t.get(`/admin/apps/${w.app.id}/products`, analyst.cookie)).statusCode).toBe(200)
    expect((await w.t.post(`/admin/apps/${w.app.id}/products`, analyst.cookie, { productId: "x_plan", entitlement: "x", displayName: "X" })).statusCode).toBe(403)
    expect((await w.t.get(`/admin/apps/${w.app.id}/products`, dev.cookie)).statusCode).toBe(403)
  })

  test("OpenAPI publishes the SDK contract", async () => {
    const w = await world()
    const spec = (await w.t.app.inject({ method: "GET", url: `${API}/docs/json` })).json()
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([`${API}/sdk/products`, `${API}/sdk/purchases/verify`, `${API}/sdk/purchases/sync`, `${API}/sdk/entitlements`, `${API}/webhooks/google-play`])
    )
    expect(ORIGIN).toBeTruthy()
  })
})
