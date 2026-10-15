import { describe, expect, test } from "vitest"

import { isEntitled } from "../src/modules/subscriptions/play.ts"
import { normalizeSubscriptionV2 } from "../src/modules/subscriptions/play.google.ts"
import { transitionEvent } from "../src/modules/subscriptions/subscriptions.service.ts"
import { decryptToken, encryptToken } from "../src/modules/subscriptions/token-cipher.ts"

describe("normalizeSubscriptionV2", () => {
  // Shape follows Google's purchases.subscriptionsv2.get response.
  const sample = {
    kind: "androidpublisher#subscriptionPurchaseV2",
    regionCode: "IN",
    latestOrderId: "GPA.3333-4444-5555-66666",
    startTime: "2026-09-01T10:00:00Z",
    subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
    linkedPurchaseToken: "old-token",
    externalAccountIdentifiers: { obfuscatedExternalAccountId: "acct-123" },
    lineItems: [
      {
        productId: "premium_monthly",
        expiryTime: "2026-12-01T10:00:00Z",
        autoRenewingPlan: { autoRenewEnabled: true },
        offerDetails: { basePlanId: "monthly" },
      },
    ],
  }

  test("maps the fields we depend on", () => {
    expect(normalizeSubscriptionV2(sample)).toEqual({
      state: "active",
      playState: "SUBSCRIPTION_STATE_ACTIVE",
      productId: "premium_monthly",
      expiresAt: new Date("2026-12-01T10:00:00Z"),
      autoRenewing: true,
      acknowledged: false,
      orderId: "GPA.3333-4444-5555-66666",
      linkedPurchaseToken: "old-token",
      obfuscatedAccountId: "acct-123",
      testPurchase: false,
    })
  })

  test.each([
    ["SUBSCRIPTION_STATE_PENDING", "pending"],
    ["SUBSCRIPTION_STATE_PAUSED", "paused"],
    ["SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "grace"],
    ["SUBSCRIPTION_STATE_ON_HOLD", "on_hold"],
    ["SUBSCRIPTION_STATE_CANCELED", "canceled"],
    ["SUBSCRIPTION_STATE_EXPIRED", "expired"],
    ["SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED", "expired"],
  ])("maps %s to %s", (playState, expected) => {
    expect(normalizeSubscriptionV2({ ...sample, subscriptionState: playState }).state).toBe(expected)
  })

  test("detects acknowledgement and test purchases, and ignores unknown fields", () => {
    const n = normalizeSubscriptionV2({
      ...sample,
      acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
      testPurchase: {},
      somethingGoogleAddedLater: { x: 1 },
    })
    expect(n.acknowledged).toBe(true)
    expect(n.testPurchase).toBe(true)
  })

  test("refuses a state it doesn't understand rather than guessing", () => {
    expect(() => normalizeSubscriptionV2({ ...sample, subscriptionState: "SUBSCRIPTION_STATE_NEW_THING" })).toThrow()
  })
})

describe("isEntitled", () => {
  const now = new Date("2026-10-15T00:00:00Z")
  const future = new Date("2026-11-01T00:00:00Z")
  const past = new Date("2026-10-01T00:00:00Z")

  test("pays only while the paid period lasts, plus grace", () => {
    expect(isEntitled("active", future, now)).toBe(true)
    expect(isEntitled("active", past, now)).toBe(false)
    expect(isEntitled("active", null, now)).toBe(false)
    expect(isEntitled("canceled", future, now)).toBe(true)
    expect(isEntitled("canceled", past, now)).toBe(false)
    expect(isEntitled("grace", past, now)).toBe(true)
  })

  test.each(["pending", "on_hold", "paused", "expired", "revoked"] as const)("%s never entitles", (state) => {
    expect(isEntitled(state, future, now)).toBe(false)
  })
})

describe("transitionEvent", () => {
  const d = (s: string) => new Date(s)

  test.each([
    [null, "active", "PURCHASED"],
    [null, "pending", "PENDING"],
    ["pending", "active", "PURCHASED"],
    ["active", "canceled", "CANCELED"],
    ["canceled", "active", "RESTARTED"],
    ["grace", "active", "RECOVERED"],
    ["active", "grace", "GRACE_PERIOD"],
    ["grace", "on_hold", "ON_HOLD"],
    ["active", "expired", "EXPIRED"],
    ["active", "revoked", "REVOKED"],
  ] as const)("%s → %s records %s", (prev, next, expected) => {
    expect(transitionEvent(prev, next, null, null)).toBe(expected)
  })

  test("a longer expiry on an unchanged active purchase is a renewal; otherwise nothing", () => {
    expect(transitionEvent("active", "active", d("2026-10-01"), d("2026-11-01"))).toBe("RENEWED")
    expect(transitionEvent("active", "active", d("2026-11-01"), d("2026-11-01"))).toBeNull()
  })
})

describe("token cipher", () => {
  const key = Buffer.alloc(32, 9)

  test("round-trips and uses a fresh IV each time", () => {
    const a = encryptToken(key, "secret-token")
    const b = encryptToken(key, "secret-token")
    expect(a).not.toBe(b)
    expect(decryptToken(key, a)).toBe("secret-token")
  })

  test("rejects tampering and the wrong key", () => {
    const enc = encryptToken(key, "secret-token")
    const parts = enc.split(".")
    parts[3] = Buffer.from("tampered").toString("base64url")
    expect(() => decryptToken(key, parts.join("."))).toThrow()
    expect(() => decryptToken(Buffer.alloc(32, 1), enc)).toThrow()
  })
})
