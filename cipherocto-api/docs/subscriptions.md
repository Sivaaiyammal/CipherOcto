# Subscriptions — how apps integrate

One backend, one SDK contract, for every app in the portfolio. Google Play only
(per `SKILL.md`). The OpenAPI document for the SDK surface is generated from the
route schemas: `GET /api/v1/docs/json` (docs are on outside production).

## Concepts

| Term | Meaning |
| --- | --- |
| **App** | A registered Android app, unique by package name. |
| **SDK key** | Per-app key (`octo_sdk_…`) sent as `X-Octo-Sdk-Key`. It ships inside the app, so it identifies the app — it is **not** a secret and grants no authority over purchases. |
| **Product** | A mapping from a Play Console subscription id to an *entitlement key*. CipherOcto never creates or edits Play products. |
| **Entitlement** | What the app checks, e.g. `premium`. Several products can grant the same one. |
| **Subject** | An opaque, unguessable id the *app* assigns to its user (8–64 chars). Entitlements are per `(app, subject)`. |

Cross-app premium is **not** automatic (`SKILL.md` §4C). Today each app's
entitlements are independent; a company-wide account would be an explicit policy
added on top.

## Purchase flow

```
App/SDK                       CipherOcto API                      Google Play
  │  setObfuscatedAccountId(subjectId)                               │
  │  launchBillingFlow ─────────────────────────────────────────────▶│
  │◀──────────────────────────────────────────────── purchaseToken ─│
  │  POST /sdk/purchases/verify {subjectId, productId, token}        │
  │ ───────────────────────────▶ subscriptionsv2.get(token) ────────▶│
  │                             ◀──────────── state, expiry, account ─│
  │                             acknowledge (if entitled) ──────────▶│
  │◀── {purchase, entitlements} (no token)                           │
  │                                                                  │
  │              RTDN (Pub/Sub push) ──▶ POST /webhooks/google-play  │
  │                  re-reads Google, updates entitlement, dedupes   │
```

An SDK client must:

1. Set `obfuscatedAccountId` to the `subjectId` when starting a purchase, so Google
   records who it was for (the server cross-checks it).
2. Call `POST /sdk/purchases/verify` immediately after Play reports a purchase, and
   treat the **server's** answer as truth. Do not unlock paid features on the Play
   callback alone.
3. **Not** acknowledge the purchase itself — the backend does, after verifying.
4. On start/restore, send everything `queryPurchasesAsync` returns to
   `POST /sdk/purchases/sync`, and read `GET /sdk/entitlements` for status.
5. Cache the last good entitlement response and fall back to it when offline; on a
   `503 verification_unavailable`, retry later rather than treating it as "not owned".

## Errors the SDK should handle

| HTTP | `error` | Meaning |
| --- | --- | --- |
| 401 | `invalid_sdk_key` | Missing, wrong or revoked key, or the app is archived. |
| 422 | `invalid_purchase` | Google doesn't recognise the token. |
| 422 | `unknown_product` / `product_mismatch` | Product isn't mapped for this app, or doesn't match the purchase. |
| 409 | `purchase_bound_elsewhere` / `subject_mismatch` | The purchase belongs to another subject. |
| 503 | `verification_unavailable` | Google or our credentials are unavailable. **Retry.** |
| 429 | `too_many_requests` | Per-key rate limit; honour `Retry-After`. |

## Wiring Google Play (operator checklist)

1. **Service account.** In Google Cloud, create a service account; in Play Console
   → *Users and permissions*, invite it with access to the app and permission to
   view financial data / manage orders. Put its JSON (or base64 of it) in
   `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
2. **Real-time developer notifications.** In Play Console → *Monetization setup*,
   set the topic of a Pub/Sub topic you own and grant
   `google-play-developer-notifications@system.gserviceaccount.com` publish rights.
3. **Push subscription.** Create a *push* subscription to
   `https://<api-host>/api/v1/webhooks/google-play` with OIDC authentication as a
   dedicated service account. Set `RTDN_AUDIENCE` to that URL and
   `RTDN_SERVICE_ACCOUNT_EMAIL` to that account.
4. **Register the app and product** in the dashboard (or via the admin API), create
   an SDK key, and set the product `active`.
5. Set `PURCHASE_TOKEN_KEY` (32 random bytes, base64) and back it up: it decrypts
   stored tokens for reconciliation.

Until steps 1 and 3 are done, verification answers `503` and the webhook answers
`503` — the system never grants access it couldn't verify.

## Operating it

- **Reconciliation** re-reads Google for purchases not verified in the last 6 h
  (scheduler: `RECONCILE_INTERVAL_MINUTES`, default 60; manual:
  `POST /admin/subscriptions/reconcile`). It is the safety net for lost or late
  notifications.
- **Idempotency:** a unique index on `(appId, tokenHash)` makes verify-twice a
  no-op, and a unique partial index on the Pub/Sub `messageId` makes redelivery a
  no-op.
- **Refunds:** voided-purchase notifications mark the purchase `revoked`; that is
  terminal and a stale "active" read can't undo it.
- **Freshness:** `GET /admin/apps/:id/subscriptions/summary` returns
  `lastVerifiedAt` so dashboards can show how current the numbers are.

## Not covered yet

- The Kotlin SDK library itself (this document is its contract).
- One-time in-app products, Apple and Stripe.
- Dashboard pages still show sample data until wired to these endpoints.
