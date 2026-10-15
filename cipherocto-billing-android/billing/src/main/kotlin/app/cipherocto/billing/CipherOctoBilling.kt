package app.cipherocto.billing

import android.app.Activity
import android.content.Context
import app.cipherocto.billing.internal.CachedEntitlements
import app.cipherocto.billing.internal.CipherOctoApi
import app.cipherocto.billing.internal.EntitlementStore
import app.cipherocto.billing.internal.HttpCipherOctoApi
import app.cipherocto.billing.internal.PlayBillingClientGateway
import app.cipherocto.billing.internal.PlayGateway
import app.cipherocto.billing.internal.PlayProduct
import app.cipherocto.billing.internal.PlayPurchaseOutcome
import app.cipherocto.billing.internal.SharedPrefsEntitlementStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Subscriptions for CipherOcto apps.
 *
 * ```
 * val billing = CipherOctoBilling.create(context, CipherOctoConfig(baseUrl, sdkKey))
 * billing.setSubject(SubjectIds.fromAppUserId(user.id))
 * billing.refresh()
 * if (billing.entitlements.value.isActive("premium")) unlockPremium()
 * ```
 *
 * Google Play does the charging; the CipherOcto backend verifies and decides. The SDK only
 * ever reports what the server confirmed (or, offline, what it last confirmed and hasn't expired).
 */
public class CipherOctoBilling internal constructor(
    private val api: CipherOctoApi,
    private val play: PlayGateway,
    private val store: EntitlementStore,
    initialSubject: String? = null,
    private val clock: () -> Long = System::currentTimeMillis,
    private val log: (String) -> Unit = {},
    scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default),
) {
    private val scope = scope
    private val lock = Mutex()

    private val _entitlements = MutableStateFlow(Entitlements.NONE)
    private val _products = MutableStateFlow<List<StoreProduct>>(emptyList())
    @Volatile private var subject: String? = null
    private var playProducts: Map<String, PlayProduct> = emptyMap()

    /** Current entitlements. Starts as [Entitlements.NONE] (nothing unlocked) until loaded. */
    public val entitlements: StateFlow<Entitlements> = _entitlements.asStateFlow()

    /** Products for this app with live Play pricing. Filled by [refresh]. */
    public val products: StateFlow<List<StoreProduct>> = _products.asStateFlow()

    init {
        if (initialSubject != null) applySubject(initialSubject)
        // Pending payments that clear later arrive here without a purchase() call waiting.
        scope.launch {
            play.unsolicitedPurchases.collect { purchases ->
                val s = subject ?: return@collect
                runCatching { verifyAll(s, purchases) }.onFailure { log("late purchase verify failed: ${it::class.simpleName}") }
            }
        }
    }

    /** Identify the signed-in user. Call on sign-in; call with a different id on account switch. */
    public fun setSubject(subjectId: String?) {
        require(subjectId == null || SubjectIds.isValid(subjectId)) { "Invalid subject id; use SubjectIds.fromAppUserId()." }
        applySubject(subjectId)
    }

    private fun applySubject(subjectId: String?) {
        if (subject == subjectId) return
        subject = subjectId
        _entitlements.value = subjectId?.let { cached(it) } ?: Entitlements.NONE
    }

    /**
     * Reloads products and entitlements. Call on app start, on resume and after sign-in.
     * Never throws for connectivity: offline it returns cached entitlements with `isOffline = true`.
     */
    public suspend fun refresh(): RefreshResult = lock.withLock refresh@{
        val s = subject ?: throw CipherOctoException.NoSubject()
        try {
            loadProducts()
        } catch (e: CipherOctoException.Network) {
            // Offline: keep whatever product list we had and fall through to the cached entitlements.
            log("product list unavailable offline")
            return@refresh RefreshResult(_entitlements.value.let { if (it === Entitlements.NONE) cachedOrNone(s) else it }, isOffline = true, rejected = emptyList())
        }
        val owned = try {
            play.ownedSubscriptions()
        } catch (e: CancellationException) {
            throw e
        } catch (e: CipherOctoException.Billing) {
            log("Play query failed: ${e.code}")
            null
        }
        try {
            val rejected = mutableListOf<RejectedPurchase>()
            val list = if (!owned.isNullOrEmpty()) {
                val out = api.sync(s, owned)
                out.results.filter { !it.ok }.forEach { rejected += RejectedPurchase(it.productId, it.error ?: "rejected") }
                out.entitlements
            } else {
                api.entitlements(s)
            }
            RefreshResult(commit(s, list), isOffline = false, rejected = rejected)
        } catch (e: CipherOctoException.Network) {
            RefreshResult(_entitlements.value.let { if (it === Entitlements.NONE) cachedOrNone(s) else it }, isOffline = true, rejected = emptyList())
        }
    }

    /** Re-reads what the user already owns on Google Play (e.g. after reinstall). Same as [refresh]. */
    public suspend fun restore(): RefreshResult = refresh()

    /**
     * Starts Google's purchase sheet and, once Google confirms, has the server verify it.
     * Nothing is unlocked until the server says so.
     *
     * @param offerToken from [StoreProduct.offers]; null uses the product's first offer.
     */
    public suspend fun purchase(activity: Activity, productId: String, offerToken: String? = null): PurchaseResult {
        val s = subject ?: return PurchaseResult.Failed(CipherOctoException.NoSubject())
        return try {
            val product = lock.withLock {
                if (playProducts[productId] == null) loadProducts()
                playProducts[productId]
            } ?: return PurchaseResult.Failed(CipherOctoException.ProductNotConfigured(productId))

            when (val outcome = play.purchase(activity, product, offerToken, s)) {
                is PlayPurchaseOutcome.Canceled -> PurchaseResult.Canceled
                is PlayPurchaseOutcome.Pending -> PurchaseResult.Pending
                is PlayPurchaseOutcome.AlreadyOwned -> {
                    // They already own it; reconcile instead of surfacing an error.
                    val r = refresh()
                    PurchaseResult.Success(r.entitlements)
                }
                is PlayPurchaseOutcome.Failed -> PurchaseResult.Failed(CipherOctoException.Billing(outcome.code, outcome.message))
                is PlayPurchaseOutcome.Purchased -> {
                    try {
                        PurchaseResult.Success(verifyAll(s, outcome.purchases))
                    } catch (e: CipherOctoException.Network) {
                        PurchaseResult.VerificationDeferred(e)
                    } catch (e: CipherOctoException.ServiceUnavailable) {
                        PurchaseResult.VerificationDeferred(e)
                    }
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: CipherOctoException) {
            PurchaseResult.Failed(e)
        }
    }

    /** Releases the Play connection and background work. Call from `Application`/test teardown only. */
    public fun close() {
        play.close()
        scope.cancel()
    }

    // ── internals ──────────────────────────────────────────────────────────

    private suspend fun verifyAll(subjectId: String, purchases: List<app.cipherocto.billing.internal.OwnedPurchase>): Entitlements {
        var latest: List<Entitlement> = emptyList()
        for (p in purchases) latest = api.verify(subjectId, p.productId, p.purchaseToken)
        return commit(subjectId, latest)
    }

    private fun commit(subjectId: String, list: List<Entitlement>): Entitlements {
        val now = clock()
        store.save(subjectId, CachedEntitlements(list, now))
        val result = Entitlements(list.associateBy { it.key }, now, fromCache = false)
        if (subject == subjectId) _entitlements.value = result
        return result
    }

    private fun cached(subjectId: String): Entitlements? =
        store.load(subjectId)?.let { Entitlements(it.entitlements.associateBy { e -> e.key }, it.verifiedAtMillis, fromCache = true) }

    private fun cachedOrNone(subjectId: String): Entitlements = cached(subjectId) ?: Entitlements.NONE

    private suspend fun loadProducts() {
        val configured = api.products()
        val live = try {
            play.queryProducts(configured.map { it.productId }).associateBy { it.productId }
        } catch (e: CancellationException) {
            throw e
        } catch (e: CipherOctoException.Billing) {
            log("Play product query failed: ${e.code}")
            emptyMap()
        }
        playProducts = live
        _products.value = configured.map {
            StoreProduct(it.productId, it.entitlement, it.displayName, it.description, live[it.productId]?.offers.orEmpty())
        }
    }

    public companion object {
        /** Creates the SDK. Keep one instance per process (e.g. in your `Application`). */
        public fun create(context: Context, config: CipherOctoConfig): CipherOctoBilling {
            val client = config.httpClient ?: OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .callTimeout(30, TimeUnit.SECONDS)
                .build()
            return CipherOctoBilling(
                api = HttpCipherOctoApi(config.baseUrl, config.sdkKey, client),
                play = PlayBillingClientGateway(context),
                store = SharedPrefsEntitlementStore(context),
                initialSubject = config.subjectId,
                log = config.logger ?: {},
            )
        }
    }
}
