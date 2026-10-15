# CipherOcto Billing (Android SDK)

Google Play subscriptions for every CipherOcto app, with entitlements decided by the
CipherOcto backend (`cipherocto-api`). Play does the charging; **the server verifies and
acknowledges**; the app only asks "is `premium` active?".

```
App ──purchase──▶ Google Play ──token──▶ SDK ──verify──▶ CipherOcto API ──▶ Play Developer API
 ▲                                                            │
 └────────────── entitlements (cached for offline) ◀──────────┘
```

> **Step-by-step walkthrough, test matrix and go-live checklist:** [docs/implementation-guide.md](docs/implementation-guide.md)

## 1. One-time operator setup (per app)

1. **Dashboard → Apps**: register the app (package name must match the Play listing).
2. **SDK keys**: create a key (`octo_sdk_…`). It identifies the app and can be revoked.
3. **Products**: map each Play subscription product ID to an entitlement key (e.g. `pro_monthly` → `premium`).
4. **API server**: set `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (service account with Play Console "View financial data" + "Manage orders"), `PURCHASE_TOKEN_KEY`, and the Pub/Sub push settings for real-time notifications (see `cipherocto-api/docs/subscriptions.md`).
5. Without the service account the API **fails closed** (503): nothing is ever unlocked unverified.

## 2. Add the SDK

```kotlin
// settings.gradle.kts
dependencyResolutionManagement { repositories { mavenLocal(); google(); mavenCentral() } }

// app/build.gradle.kts
dependencies { implementation("app.cipherocto:billing:0.1.0") }
```

Publish from this repo: `./gradlew :billing:publishToMavenLocal` (or your internal Maven repo).

## 3. Initialise once, in `Application`

```kotlin
class MyApp : Application() {
    lateinit var billing: CipherOctoBilling
    override fun onCreate() {
        super.onCreate()
        billing = CipherOctoBilling.create(
            this,
            CipherOctoConfig(baseUrl = "https://api.yourcompany.com", sdkKey = BuildConfig.OCTO_SDK_KEY),
        )
    }
}
```

## 4. Identify the user

Use a stable, opaque id — never an email. `SubjectIds.fromAppUserId` hashes your user id.

```kotlin
billing.setSubject(SubjectIds.fromAppUserId(user.id))   // on sign-in
billing.setSubject(null)                                 // on sign-out
```

Entitlements follow the subject, so a user keeps access across devices and reinstalls.

## 5. Load state and gate features

```kotlin
lifecycleScope.launch { billing.refresh() }              // start + resume + after sign-in

billing.entitlements.collect { if (it.isActive("premium")) unlock() else lock() }
billing.products.collect { showPaywall(it) }             // live Play prices
```

`refresh()` also restores purchases (reinstall, new device). It never throws on connectivity:
offline it returns the last server-confirmed entitlements (`isOffline = true`), and expiry is
still enforced locally.

## 6. Purchase

```kotlin
when (val r = billing.purchase(activity, productId = "pro_monthly", offerToken = offer.offerToken)) {
    is PurchaseResult.Success              -> unlock()
    PurchaseResult.Canceled                -> Unit
    PurchaseResult.Pending                 -> toast("Payment pending; we'll unlock when it clears")
    is PurchaseResult.VerificationDeferred -> toast("Paid. Finishing up…")  // call refresh() later
    is PurchaseResult.Failed               -> showError(r.error)
}
```

Don't call `acknowledgePurchase` yourself — the server does it after verifying. Unacknowledged
purchases are refunded by Google after 3 days, so keep `refresh()` on app start and resume.

## Errors

| Exception | Meaning | What to do |
|---|---|---|
| `InvalidSdkKey` | key wrong/revoked/app archived | config bug; check key |
| `NoSubject` | `setSubject` not called | call it on sign-in |
| `ProductNotConfigured` | product not mapped in dashboard | map it |
| `PurchaseBelongsToAnotherAccount` | token bound to another subject | tell the user |
| `ServiceUnavailable` / `RateLimited` | retry later | `refresh()` with backoff |
| `Network` | offline | cached entitlements apply |
| `Billing(code)` | Google Play error | see `BillingResponseCode` |

## Testing

Use Play Console **license testers** and an internal-testing build. Test cards renew every
few minutes, so cancel/grace/expiry can be observed quickly. Local API: `baseUrl = "http://10.0.2.2:4000"`
(cleartext only allowed for localhost/emulator).

## Build and test the SDK

```
JAVA_HOME=<Android Studio>/jbr ./gradlew :billing:testDebugUnitTest :billing:assembleRelease
```
