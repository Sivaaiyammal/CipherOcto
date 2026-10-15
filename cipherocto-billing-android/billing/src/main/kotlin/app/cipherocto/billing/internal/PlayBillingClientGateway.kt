package app.cipherocto.billing.internal

import android.app.Activity
import android.content.Context
import app.cipherocto.billing.CipherOctoException
import app.cipherocto.billing.Offer
import app.cipherocto.billing.PricingPhase
import app.cipherocto.billing.Recurrence
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.queryProductDetails
import com.android.billingclient.api.queryPurchasesAsync
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume

/**
 * The only file that touches the Google Play Billing Library.
 *
 * It never acknowledges purchases: the CipherOcto backend does that after verifying them,
 * so a purchase is never "completed" on the strength of a client's word alone.
 */
internal class PlayBillingClientGateway(context: Context) : PlayGateway, PurchasesUpdatedListener {

    private val unsolicited = MutableSharedFlow<List<OwnedPurchase>>(extraBufferCapacity = 8)
    override val unsolicitedPurchases: Flow<List<OwnedPurchase>> = unsolicited.asSharedFlow()

    private val connectLock = Mutex()
    @Volatile private var waiting: CompletableDeferred<PlayPurchaseOutcome>? = null

    private val client: BillingClient = BillingClient.newBuilder(context.applicationContext)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()

    private suspend fun ensureConnected() {
        if (client.isReady) return
        connectLock.withLock {
            if (client.isReady) return
            val result = suspendCancellableCoroutine<BillingResult> { cont ->
                client.startConnection(object : BillingClientStateListener {
                    override fun onBillingSetupFinished(billingResult: BillingResult) {
                        if (cont.isActive) cont.resume(billingResult)
                    }

                    override fun onBillingServiceDisconnected() = Unit
                })
            }
            if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                throw CipherOctoException.Billing(result.responseCode, result.debugMessage)
            }
        }
    }

    override suspend fun queryProducts(productIds: List<String>): List<PlayProduct> {
        if (productIds.isEmpty()) return emptyList()
        ensureConnected()
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                productIds.map {
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(it)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                }
            )
            .build()
        val result = client.queryProductDetails(params)
        if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            throw CipherOctoException.Billing(result.billingResult.responseCode, result.billingResult.debugMessage)
        }
        return result.productDetailsList.orEmpty().map { d -> PlayProduct(d.productId, d.toOffers(), d) }
    }

    override suspend fun purchase(activity: Activity, product: PlayProduct, offerToken: String?, subjectId: String): PlayPurchaseOutcome {
        ensureConnected()
        val details = product.handle as? ProductDetails
            ?: return PlayPurchaseOutcome.Failed(BillingClient.BillingResponseCode.DEVELOPER_ERROR, "No Play product details.")
        val token = offerToken ?: details.subscriptionOfferDetails?.firstOrNull()?.offerToken
            ?: return PlayPurchaseOutcome.Failed(BillingClient.BillingResponseCode.ITEM_UNAVAILABLE, "No offer available.")

        val flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .setOfferToken(token)
                        .build()
                )
            )
            // Lets Google (and the server) prove whose purchase this is.
            .setObfuscatedAccountId(subjectId)
            .build()

        val deferred = CompletableDeferred<PlayPurchaseOutcome>()
        waiting = deferred
        try {
            val launch = withContext(Dispatchers.Main) { client.launchBillingFlow(activity, flow) }
            if (launch.responseCode != BillingClient.BillingResponseCode.OK) {
                return mapFailure(launch)
            }
            return deferred.await()
        } finally {
            if (waiting === deferred) waiting = null
        }
    }

    override suspend fun ownedSubscriptions(): List<OwnedPurchase> {
        ensureConnected()
        val result = client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        )
        if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            throw CipherOctoException.Billing(result.billingResult.responseCode, result.billingResult.debugMessage)
        }
        return result.purchasesList.toOwned()
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        val outcome = when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val list = purchases.orEmpty()
                val owned = list.toOwned()
                when {
                    owned.isNotEmpty() -> PlayPurchaseOutcome.Purchased(owned)
                    list.any { it.purchaseState == Purchase.PurchaseState.PENDING } -> PlayPurchaseOutcome.Pending
                    else -> PlayPurchaseOutcome.Failed(billingResult.responseCode, "No purchase returned.")
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> PlayPurchaseOutcome.Canceled
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> PlayPurchaseOutcome.AlreadyOwned
            else -> mapFailure(billingResult)
        }

        val waiter = waiting
        if (waiter != null && !waiter.isCompleted) {
            waiter.complete(outcome)
        } else if (outcome is PlayPurchaseOutcome.Purchased) {
            // A purchase nobody was waiting for (e.g. a pending payment that cleared later).
            unsolicited.tryEmit(outcome.purchases)
        }
    }

    override fun close() {
        if (client.isReady) client.endConnection()
    }

    private fun mapFailure(result: BillingResult) = PlayPurchaseOutcome.Failed(result.responseCode, result.debugMessage)

    private fun List<Purchase>.toOwned(): List<OwnedPurchase> =
        filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
            .flatMap { p -> p.products.map { OwnedPurchase(it, p.purchaseToken) } }

    private fun ProductDetails.toOffers(): List<Offer> =
        subscriptionOfferDetails.orEmpty().map { o ->
            Offer(
                offerToken = o.offerToken,
                basePlanId = o.basePlanId,
                offerId = o.offerId,
                phases = o.pricingPhases.pricingPhaseList.map { p ->
                    PricingPhase(
                        formattedPrice = p.formattedPrice,
                        priceAmountMicros = p.priceAmountMicros,
                        currencyCode = p.priceCurrencyCode,
                        billingPeriod = p.billingPeriod,
                        recurrence = when (p.recurrenceMode) {
                            ProductDetails.RecurrenceMode.INFINITE_RECURRING -> Recurrence.INFINITE
                            ProductDetails.RecurrenceMode.FINITE_RECURRING -> Recurrence.FINITE
                            else -> Recurrence.NON_RECURRING
                        },
                    )
                },
            )
        }
}
