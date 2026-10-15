package app.cipherocto.billing.internal

import android.app.Activity
import app.cipherocto.billing.Offer
import kotlinx.coroutines.flow.Flow

/** A purchase Google reports as completed. Pending ones are never surfaced as owned. */
internal data class OwnedPurchase(val productId: String, val purchaseToken: String) {
    // Tokens are secrets: keep them out of logs and crash reports.
    override fun toString(): String = "OwnedPurchase(productId=$productId)"
}

internal class PlayProduct(
    val productId: String,
    val offers: List<Offer>,
    /** Opaque handle only the real gateway understands (the Play `ProductDetails`). */
    val handle: Any?,
)

internal sealed interface PlayPurchaseOutcome {
    data class Purchased(val purchases: List<OwnedPurchase>) : PlayPurchaseOutcome
    data object Pending : PlayPurchaseOutcome
    data object Canceled : PlayPurchaseOutcome
    data object AlreadyOwned : PlayPurchaseOutcome
    data class Failed(val code: Int, val message: String) : PlayPurchaseOutcome
}

/**
 * Everything the SDK needs from Google Play Billing, as an interface, so the purchase
 * logic can be tested without a device or Google Play services.
 */
internal interface PlayGateway {
    /** Purchases that completed while no [purchase] call was waiting (e.g. a pending one that cleared). */
    val unsolicitedPurchases: Flow<List<OwnedPurchase>>

    suspend fun queryProducts(productIds: List<String>): List<PlayProduct>

    suspend fun purchase(activity: Activity, product: PlayProduct, offerToken: String?, subjectId: String): PlayPurchaseOutcome

    suspend fun ownedSubscriptions(): List<OwnedPurchase>

    fun close()
}
