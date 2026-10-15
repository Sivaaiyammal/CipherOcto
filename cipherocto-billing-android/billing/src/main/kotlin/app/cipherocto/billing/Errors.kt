package app.cipherocto.billing

/** Everything the SDK can fail with, as values the app can `when` over. */
public sealed class CipherOctoException(message: String, cause: Throwable? = null) : Exception(message, cause) {

    /** The SDK key is missing, wrong or revoked, or the app was archived. A configuration bug, not a user error. */
    public class InvalidSdkKey : CipherOctoException("The CipherOcto SDK key was rejected.")

    /** [CipherOctoBilling.setSubject] hasn't been called, so purchases can't be attributed to anyone. */
    public class NoSubject : CipherOctoException("Call setSubject() with your user's id before purchasing.")

    /** Google doesn't recognise this purchase. */
    public class InvalidPurchase : CipherOctoException("That purchase couldn't be verified.")

    /** The product isn't set up (or isn't active) for this app in CipherOcto. */
    public class ProductNotConfigured(public val productId: String) :
        CipherOctoException("Product '$productId' isn't configured for this app.")

    /** The purchase was made under a different account. */
    public class PurchaseBelongsToAnotherAccount :
        CipherOctoException("This purchase belongs to a different account.")

    /** The verifier or Google is temporarily unavailable. Safe to retry. */
    public class ServiceUnavailable(public val retryAfterSeconds: Long?) :
        CipherOctoException("Purchase verification is temporarily unavailable.")

    public class RateLimited(public val retryAfterSeconds: Long?) :
        CipherOctoException("Too many requests. Try again shortly.")

    /** No connection, DNS failure, TLS failure or timeout. */
    public class Network(cause: Throwable) : CipherOctoException("Can't reach CipherOcto.", cause)

    /** Google Play Billing reported a problem. [code] is a `BillingClient.BillingResponseCode`. */
    public class Billing(public val code: Int, detail: String) : CipherOctoException("Google Play billing error $code: $detail")

    /** The server answered with something this SDK version doesn't understand. */
    public class Unexpected(public val status: Int, public val errorCode: String?) :
        CipherOctoException("Unexpected response ($status${errorCode?.let { ", $it" } ?: ""}).")
}
