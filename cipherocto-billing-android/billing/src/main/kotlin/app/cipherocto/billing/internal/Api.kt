package app.cipherocto.billing.internal

import app.cipherocto.billing.BuildConfig
import app.cipherocto.billing.CipherOctoException
import app.cipherocto.billing.Entitlement
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// ── What the SDK needs from the CipherOcto backend ─────────────────────────

internal data class ServerProduct(val productId: String, val entitlement: String, val displayName: String, val description: String)

internal data class SyncOutcome(val results: List<SyncItemResult>, val entitlements: List<Entitlement>)

internal data class SyncItemResult(val productId: String, val ok: Boolean, val error: String?)

internal interface CipherOctoApi {
    suspend fun products(): List<ServerProduct>
    suspend fun verify(subjectId: String, productId: String, purchaseToken: String): List<Entitlement>
    suspend fun sync(subjectId: String, purchases: List<OwnedPurchase>): SyncOutcome
    suspend fun entitlements(subjectId: String): List<Entitlement>
}

// ── Wire format (mirrors the OpenAPI document at /api/v1/docs/json) ────────

@Serializable private class ProductDto(val productId: String, val entitlement: String, val displayName: String, val description: String = "")
@Serializable private class ProductsResponse(val products: List<ProductDto>)
@Serializable private class EntitlementDto(val key: String, val active: Boolean, val expiresAt: String? = null)
@Serializable private class EntitlementsResponse(val entitlements: List<EntitlementDto>)
@Serializable private class VerifyRequest(val subjectId: String, val productId: String, val purchaseToken: String)
@Serializable private class VerifyResponse(val entitlements: List<EntitlementDto>)
@Serializable private class SyncItem(val productId: String, val purchaseToken: String)
@Serializable private class SyncRequest(val subjectId: String, val purchases: List<SyncItem>)
@Serializable private class SyncResultDto(val productId: String, val ok: Boolean, val error: String? = null)
@Serializable private class SyncResponse(val results: List<SyncResultDto>, val entitlements: List<EntitlementDto>)
@Serializable private class ErrorBody(val error: String? = null, val message: String? = null, val retryAfterSeconds: Long? = null)

private fun EntitlementDto.toDomain() = Entitlement(key, active, expiresAt?.let(Iso8601::parseMillis))

private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

internal class HttpCipherOctoApi(
    baseUrl: String,
    private val sdkKey: String,
    private val client: OkHttpClient,
) : CipherOctoApi {

    private val root = baseUrl.trim().trimEnd('/') + "/api/v1/sdk"
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    override suspend fun products(): List<ServerProduct> =
        json.decodeFromString<ProductsResponse>(get("/products")).products.map {
            ServerProduct(it.productId, it.entitlement, it.displayName, it.description)
        }

    override suspend fun verify(subjectId: String, productId: String, purchaseToken: String): List<Entitlement> =
        json.decodeFromString<VerifyResponse>(
            post("/purchases/verify", json.encodeToString(VerifyRequest.serializer(), VerifyRequest(subjectId, productId, purchaseToken)))
        ).entitlements.map { it.toDomain() }

    override suspend fun sync(subjectId: String, purchases: List<OwnedPurchase>): SyncOutcome {
        val body = SyncRequest(subjectId, purchases.map { SyncItem(it.productId, it.purchaseToken) })
        val r = json.decodeFromString<SyncResponse>(post("/purchases/sync", json.encodeToString(SyncRequest.serializer(), body)))
        return SyncOutcome(r.results.map { SyncItemResult(it.productId, it.ok, it.error) }, r.entitlements.map { it.toDomain() })
    }

    override suspend fun entitlements(subjectId: String): List<Entitlement> {
        // subjectId is opaque and URL-safe by construction, but encode defensively.
        val url = "$root/entitlements".toHttpUrl().newBuilder().addQueryParameter("subjectId", subjectId).build()
        return json.decodeFromString<EntitlementsResponse>(execute(request(url.toString()).get().build())).entitlements.map { it.toDomain() }
    }

    private fun request(url: String) =
        Request.Builder()
            .url(url)
            .header("X-Octo-Sdk-Key", sdkKey)
            .header("Accept", "application/json")
            .header("User-Agent", "cipherocto-billing-android/${BuildConfig.SDK_VERSION}")

    private suspend fun get(path: String) = execute(request(root + path).get().build())

    private suspend fun post(path: String, body: String) =
        execute(request(root + path).post(body.toRequestBody(JSON_MEDIA)).build())

    private suspend fun execute(request: Request): String {
        val response = try {
            client.newCall(request).await()
        } catch (e: IOException) {
            throw CipherOctoException.Network(e)
        }
        response.use { r ->
            val text = try {
                r.body?.string().orEmpty()
            } catch (e: IOException) {
                throw CipherOctoException.Network(e)
            }
            if (r.isSuccessful) return text
            throw mapError(r.code, text, r.header("Retry-After")?.toLongOrNull())
        }
    }

    private fun mapError(status: Int, body: String, retryAfterHeader: Long?): CipherOctoException {
        val parsed = runCatching { json.decodeFromString<ErrorBody>(body) }.getOrNull()
        val code = parsed?.error
        val retry = parsed?.retryAfterSeconds ?: retryAfterHeader
        return when {
            status == 401 && code == "invalid_sdk_key" -> CipherOctoException.InvalidSdkKey()
            status == 422 && code == "invalid_purchase" -> CipherOctoException.InvalidPurchase()
            status == 422 && (code == "unknown_product" || code == "product_mismatch") -> CipherOctoException.ProductNotConfigured(code.orEmpty())
            status == 409 && (code == "purchase_bound_elsewhere" || code == "subject_mismatch") -> CipherOctoException.PurchaseBelongsToAnotherAccount()
            status == 429 -> CipherOctoException.RateLimited(retry)
            status in 500..599 -> CipherOctoException.ServiceUnavailable(retry)
            else -> CipherOctoException.Unexpected(status, code)
        }
    }
}

/** OkHttp's `Call` as a cancellable suspension point. */
private suspend fun Call.await(): Response = suspendCancellableCoroutine { cont ->
    enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) = cont.resume(response)
        override fun onFailure(call: Call, e: IOException) {
            if (!cont.isCancelled) cont.resumeWithException(e)
        }
    })
    cont.invokeOnCancellation { runCatching { cancel() } }
}
