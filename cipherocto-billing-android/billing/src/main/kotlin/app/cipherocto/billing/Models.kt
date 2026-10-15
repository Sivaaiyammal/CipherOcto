package app.cipherocto.billing

/** One access right, e.g. `premium`, as decided by the CipherOcto backend. */
public data class Entitlement(
    public val key: String,
    public val active: Boolean,
    /** When paid access ends, or null when the server gave no expiry. */
    public val expiresAtMillis: Long?,
) {
    /** `active` is the server's verdict; expiry is re-checked locally so offline use can't outlive a plan. */
    public fun isActiveAt(nowMillis: Long): Boolean = active && (expiresAtMillis == null || expiresAtMillis > nowMillis)
}

/** The set of entitlements for the current user. Always built from a server response or a cached one. */
public class Entitlements internal constructor(
    private val byKey: Map<String, Entitlement>,
    /** When the server last confirmed these, or null if never. */
    public val verifiedAtMillis: Long?,
    /** True when this came from the on-device cache because the server wasn't reachable. */
    public val fromCache: Boolean,
) {
    public val all: List<Entitlement> get() = byKey.values.sortedBy { it.key }

    public operator fun get(key: String): Entitlement? = byKey[key]

    /** The one call apps gate features on. Unknown keys are inactive. */
    public fun isActive(key: String, nowMillis: Long = System.currentTimeMillis()): Boolean =
        byKey[key]?.isActiveAt(nowMillis) == true

    override fun toString(): String = "Entitlements(${byKey.values.joinToString { "${it.key}=${it.active}" }}, fromCache=$fromCache)"

    public companion object {
        /** Nothing verified yet. Fails closed: no feature is unlocked. */
        public val NONE: Entitlements = Entitlements(emptyMap(), null, false)
    }
}

public enum class Recurrence { INFINITE, FINITE, NON_RECURRING }

public data class PricingPhase(
    public val formattedPrice: String,
    public val priceAmountMicros: Long,
    public val currencyCode: String,
    /** ISO-8601 period such as `P1M`. */
    public val billingPeriod: String,
    public val recurrence: Recurrence,
)

/** A purchasable base plan / offer. Pass [offerToken] to [CipherOctoBilling.purchase]. */
public data class Offer(
    public val offerToken: String,
    public val basePlanId: String,
    public val offerId: String?,
    public val phases: List<PricingPhase>,
)

/**
 * A product configured for this app in CipherOcto, joined with live pricing from Google Play.
 * `offers` is empty when Play's details couldn't be loaded; such products can't be bought yet.
 */
public data class StoreProduct(
    public val productId: String,
    public val entitlement: String,
    public val displayName: String,
    public val description: String,
    public val offers: List<Offer>,
)

public sealed class PurchaseResult {
    /** Verified by the server. [entitlements] is the new truth. */
    public data class Success(public val entitlements: Entitlements) : PurchaseResult()

    public data object Canceled : PurchaseResult()

    /** Payment is still being processed (e.g. cash or bank transfer). Nothing is unlocked yet. */
    public data object Pending : PurchaseResult()

    /**
     * The user was charged but we couldn't reach the verifier. Nothing is unlocked yet; the
     * purchase is safe with Google and [CipherOctoBilling.refresh] will complete it.
     */
    public data class VerificationDeferred(public val reason: CipherOctoException) : PurchaseResult()

    public data class Failed(public val error: CipherOctoException) : PurchaseResult()
}

public data class RejectedPurchase(public val productId: String, public val reason: String)

public data class RefreshResult(
    public val entitlements: Entitlements,
    /** True when the server couldn't be reached and cached entitlements were used. */
    public val isOffline: Boolean,
    /** Owned purchases the server refused (for example, bound to another account). */
    public val rejected: List<RejectedPurchase>,
)
