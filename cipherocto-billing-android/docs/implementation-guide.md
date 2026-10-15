# Implementation guide

Step-by-step for adding CipherOcto subscriptions to an Android app. Follow it in order;
each step says how to tell it worked. Reference material (errors, architecture) is in the
[README](../README.md).

**You need:** an app with a Google Play listing (internal testing track is enough), a
CipherOcto dashboard login with the `apps.write` / `subscriptions.write` permissions (admin
or finance role), and a signed-in user concept in your app (any stable user id).

---

## Part A. Operator setup (dashboard and Play Console)

### A1. Create the subscription in Play Console
1. Play Console → your app → **Monetize → Products → Subscriptions → Create subscription**.
2. Product ID, e.g. `pro_monthly` (cannot be changed later). Add a base plan (monthly, auto-renewing) and activate it.
3. Keep the product ID: you'll map it in A3.

### A2. Register the app and create an SDK key
1. Dashboard → **Apps → Register app**. Package name must equal the Play listing's.
2. Dashboard → app → **SDK keys → Create**. Copy the `octo_sdk_…` value (shown once).
   One key per app and environment; revoke it from the dashboard if it leaks.

### A3. Map product → entitlement
Dashboard → app → **Products → Add**: product `pro_monthly`, entitlement key `premium`.
The entitlement key is what your code checks; several products can unlock the same key
(monthly + yearly → `premium`).

### A4. Connect the API to Google (once per company)
1. Google Cloud: create a service account, enable the **Google Play Android Developer API**.
2. Play Console → **Users and permissions** → invite the service account with *View financial data* and *Manage orders and subscriptions*.
3. API server env: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `PURCHASE_TOKEN_KEY` (32 random bytes, base64).
4. Real-time notifications: Play Console → **Monetize setup → Real-time developer notifications** → a Pub/Sub topic; create a **push** subscription to
   `https://<api>/api/v1/webhooks/google-play` with OIDC auth, and set `RTDN_AUDIENCE` / `RTDN_SERVICE_ACCOUNT_EMAIL` on the API.

**Check:** `GET /api/v1/admin/subscriptions/summary` returns data; with no service account
configured, verification returns 503 (by design — nothing unlocks unverified).

---

## Part B. App integration

### B1. Dependency
```kotlin
// settings.gradle.kts
dependencyResolutionManagement { repositories { mavenLocal(); google(); mavenCentral() } }
// app/build.gradle.kts
dependencies { implementation("app.cipherocto:billing:0.1.0") }
```
Publish the SDK first: `./gradlew :billing:publishToMavenLocal` in `cipherocto-billing-android`
(or push to your internal Maven repo).

### B2. Keep the SDK key out of source control
```kotlin
// app/build.gradle.kts
android { buildFeatures { buildConfig = true } }
defaultConfig {
    buildConfigField("String", "OCTO_SDK_KEY", "\"${providers.gradleProperty("octoSdkKey").orNull ?: ""}\"")
    buildConfigField("String", "OCTO_API", "\"https://api.yourcompany.com\"")
}
```
Put `octoSdkKey=octo_sdk_…` in `~/.gradle/gradle.properties` or CI secrets. The key isn't an
authority (it can't grant entitlements), but treating it as config keeps rotation easy.

### B3. Create one instance in `Application`
```kotlin
class App : Application() {
    val billing by lazy {
        CipherOctoBilling.create(
            this,
            CipherOctoConfig(
                baseUrl = BuildConfig.OCTO_API,
                sdkKey = BuildConfig.OCTO_SDK_KEY,
                logger = if (BuildConfig.DEBUG) { m -> Log.d("Billing", m) } else null,
            ),
        )
    }
}
```
Register `App` in the manifest. The SDK adds the `INTERNET` permission and the Play Billing
dependency itself.

### B4. Tie the subject to your sign-in
```kotlin
// after login / session restore
app.billing.setSubject(SubjectIds.fromAppUserId(user.id))
// on logout
app.billing.setSubject(null)
```
- Use a stable internal id, not an email or anything the user can change.
- The same user id on another device resolves to the same entitlements.
- Anonymous users: generate a UUID, store it, and use that. Purchases are tied to it.

### B5. Refresh on start and resume
```kotlin
class MainActivity : ComponentActivity() {
    override fun onResume() {
        super.onResume()
        lifecycleScope.launch {
            runCatching { (application as App).billing.refresh() }
        }
    }
}
```
`refresh()` reads what the user owns on Google Play, has the server verify it, and updates
`entitlements`. This is also your restore-purchases path and recovers purchases that were
paid while the verifier was down. Offline it returns the cache instead of throwing.

### B6. Gate features
```kotlin
val billing = (application as App).billing

// Compose
val ent by billing.entitlements.collectAsStateWithLifecycle()
if (ent.isActive("premium")) PremiumContent() else Paywall()

// One-off check
if (billing.entitlements.value.isActive("premium")) exportPdf()
```
Initial state is `Entitlements.NONE`: **features stay locked until the server confirms**.
Show a loading state if you don't want a flash of locked UI (`verifiedAtMillis == null`
means not loaded yet).

### B7. Paywall
```kotlin
@Composable
fun Paywall(billing: CipherOctoBilling, activity: Activity) {
    val products by billing.products.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var message by remember { mutableStateOf<String?>(null) }

    products.forEach { p ->
        val offer = p.offers.firstOrNull() ?: return@forEach   // no Play pricing → can't sell yet
        val price = offer.phases.last().formattedPrice
        Button(onClick = {
            scope.launch {
                message = when (val r = billing.purchase(activity, p.productId, offer.offerToken)) {
                    is PurchaseResult.Success -> null                       // entitlements flow updates the UI
                    PurchaseResult.Canceled -> null
                    PurchaseResult.Pending -> "Payment pending. We'll unlock Premium when it clears."
                    is PurchaseResult.VerificationDeferred -> "Payment received. Finishing up…"
                    is PurchaseResult.Failed -> userMessage(r.error)
                }
            }
        }) { Text("${p.displayName} — $price") }
    }
    message?.let { Text(it) }
}

fun userMessage(e: CipherOctoException) = when (e) {
    is CipherOctoException.PurchaseBelongsToAnotherAccount -> "This purchase is linked to another account."
    is CipherOctoException.Network -> "No connection. Please try again."
    is CipherOctoException.ServiceUnavailable, is CipherOctoException.RateLimited -> "Please try again in a moment."
    else -> "Something went wrong. Please try again."
}
```
Pricing text always comes from Play (`formattedPrice`), so currency and tax are correct per user.

### B8. Free trials and intro offers
Configured in Play Console as offers on the base plan. They appear as extra entries in
`p.offers` with an earlier `FINITE` phase; show `offer.phases` to describe them
(e.g. "7 days free, then $4.99/month"). Eligibility is decided by Google.

### B9. Manage / cancel
Link users to Google's page; cancellation is handled by Play and reaches the server through
RTDN (access continues until the paid period ends):
```kotlin
startActivity(Intent(Intent.ACTION_VIEW,
    Uri.parse("https://play.google.com/store/account/subscriptions?sku=pro_monthly&package=$packageName")))
```

---

## Part C. Test it

1. Play Console → **Setup → License testing**: add tester Gmail accounts.
2. Upload a build to **Internal testing**, install it from the Play link on a device signed in as the tester.
3. Run through:

| Case | Expect |
|---|---|
| Fresh install, not subscribed | `isActive("premium") == false` |
| Buy `pro_monthly` | `Success`, feature unlocks, dashboard shows an active entitlement |
| Kill the app, reopen | still unlocked (cache), then confirmed by `refresh()` |
| Airplane mode, reopen | unlocked (cache) until `expiresAt` |
| Cancel in Play | stays unlocked until period end, then locks |
| Uninstall, reinstall, sign in | unlocked after `refresh()` |
| Sign in as a different user on the same device | locked; the first user's access is not shown |
| Stop the API / break Play credentials, then buy | `VerificationDeferred`, nothing unlocked; recovers on next `refresh()` |

Test subscriptions renew every few minutes (monthly ≈ 5 min, up to 6 renewals) so expiry
is observable quickly. Local backend: use `http://10.0.2.2:4000` as `baseUrl` with the
`FakePlayVerifier` setup from the API README.

---

## Part D. Go-live checklist

- [ ] Service account has Play permissions; verification works against a real tester purchase.
- [ ] RTDN push subscription delivers (dashboard → Subscriptions → Events shows entries).
- [ ] SDK key is the production key, injected from CI, not committed.
- [ ] `baseUrl` is `https://` (the SDK rejects cleartext outside localhost/emulator).
- [ ] App calls `refresh()` on start and resume, and `setSubject(null)` on logout.
- [ ] No code calls `acknowledgePurchase` or `consumeAsync` for subscriptions.
- [ ] Paywall copy states price, renewal period and how to cancel (Play policy).
- [ ] Reconciliation job running on the API (`RECONCILE_INTERVAL_MINUTES`).
- [ ] Atlas / API secrets rotated from any development values.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `products` has items but `offers` is empty | product not active in Play, app not on a testing track, or tester not licensed |
| `InvalidSdkKey` | wrong/revoked key, or app archived in the dashboard |
| `ProductNotConfigured` | product ID not mapped under the app's Products |
| `ServiceUnavailable` on every purchase | API has no Google credentials (fails closed) or Play API quota/permission error |
| Purchase succeeds, never unlocks | verification outage; call `refresh()`; check dashboard Events |
| `PurchaseBelongsToAnotherAccount` | the token was verified under a different `subjectId` |
| Works in debug, not release | release build not uploaded to a Play track the tester can access |
