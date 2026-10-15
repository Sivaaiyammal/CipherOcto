package app.cipherocto.billing

import app.cipherocto.billing.internal.HttpCipherOctoApi
import app.cipherocto.billing.internal.OwnedPurchase
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

class HttpApiTest {
    private lateinit var server: MockWebServer
    private lateinit var api: HttpCipherOctoApi

    @Before fun setUp() {
        server = MockWebServer().also { it.start() }
        api = HttpCipherOctoApi(server.url("/").toString(), "octo_sdk_test", OkHttpClient())
    }

    @After fun tearDown() = server.shutdown()

    private fun json(code: Int, body: String) = MockResponse().setResponseCode(code).setHeader("Content-Type", "application/json").setBody(body)

    private inline fun <reified T : CipherOctoException> assertFails(block: () -> Unit): T {
        try {
            block()
        } catch (e: CipherOctoException) {
            assertTrue("expected ${T::class.simpleName} but was $e", e is T)
            return e as T
        }
        fail("expected ${T::class.simpleName}")
        throw IllegalStateException()
    }

    @Test fun verifySendsKeyAndParsesEntitlements(): Unit = runBlocking {
        server.enqueue(json(200, """{"entitlements":[{"key":"premium","active":true,"expiresAt":"2026-10-15T17:56:23.646Z"}]}"""))
        val result = api.verify("subject-12345678", "pro_monthly", "tok")
        val req = server.takeRequest()
        assertEquals("/api/v1/sdk/purchases/verify", req.path)
        assertEquals("octo_sdk_test", req.getHeader("X-Octo-Sdk-Key"))
        assertTrue(req.body.readUtf8().contains("\"purchaseToken\":\"tok\""))
        assertEquals("premium", result.single().key)
        assertEquals(true, result.single().active)
        assertEquals(1_792_086_983_646L, result.single().expiresAtMillis)
    }

    @Test fun syncReportsPerItemResults(): Unit = runBlocking {
        server.enqueue(json(200, """{"results":[{"productId":"a","ok":true},{"productId":"b","ok":false,"error":"purchase_bound_elsewhere"}],"entitlements":[]}"""))
        val out = api.sync("subject-12345678", listOf(OwnedPurchase("a", "t1"), OwnedPurchase("b", "t2")))
        assertEquals(listOf(true, false), out.results.map { it.ok })
        assertEquals("purchase_bound_elsewhere", out.results[1].error)
    }

    @Test fun mapsErrors(): Unit = runBlocking {
        server.enqueue(json(401, """{"error":"invalid_sdk_key","message":"x"}"""))
        assertFails<CipherOctoException.InvalidSdkKey> { runBlocking { api.products() } }

        server.enqueue(json(422, """{"error":"invalid_purchase","message":"x"}"""))
        assertFails<CipherOctoException.InvalidPurchase> { runBlocking { api.verify("subject-12345678", "p", "t") } }

        server.enqueue(json(409, """{"error":"purchase_bound_elsewhere","message":"x"}"""))
        assertFails<CipherOctoException.PurchaseBelongsToAnotherAccount> { runBlocking { api.verify("subject-12345678", "p", "t") } }

        server.enqueue(json(503, """{"error":"verification_unavailable","message":"x"}""").setHeader("Retry-After", "30"))
        val unavailable = assertFails<CipherOctoException.ServiceUnavailable> { runBlocking { api.verify("subject-12345678", "p", "t") } }
        assertEquals(30L, unavailable.retryAfterSeconds)

        server.enqueue(json(429, """{"error":"rate_limited","message":"x"}"""))
        assertFails<CipherOctoException.RateLimited> { runBlocking { api.entitlements("subject-12345678") } }
    }

    @Test fun unreachableServerIsNetworkError(): Unit = runBlocking {
        server.shutdown()
        assertFails<CipherOctoException.Network> { runBlocking { api.products() } }
    }
}
