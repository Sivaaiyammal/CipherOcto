package app.cipherocto.billing

import android.app.Activity
import app.cipherocto.billing.internal.CipherOctoApi
import app.cipherocto.billing.internal.InMemoryEntitlementStore
import app.cipherocto.billing.internal.OwnedPurchase
import app.cipherocto.billing.internal.PlayGateway
import app.cipherocto.billing.internal.PlayProduct
import app.cipherocto.billing.internal.PlayPurchaseOutcome
import app.cipherocto.billing.internal.ServerProduct
import app.cipherocto.billing.internal.SyncItemResult
import app.cipherocto.billing.internal.SyncOutcome
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

private const val SUBJECT = "subject-12345678"
private const val NOW = 1_800_000_000_000L

private class FakeApi : CipherOctoApi {
    var offline = false
    var unavailable = false
    var entitlements = listOf(Entitlement("premium", true, NOW + 86_400_000))
    var syncResults = emptyList<SyncItemResult>()
    val verified = mutableListOf<String>()

    private fun guard() {
        if (offline) throw CipherOctoException.Network(java.io.IOException("down"))
    }

    override suspend fun products() = run { guard(); listOf(ServerProduct("pro_monthly", "premium", "Pro", "")) }
    override suspend fun verify(subjectId: String, productId: String, purchaseToken: String): List<Entitlement> {
        guard()
        if (unavailable) throw CipherOctoException.ServiceUnavailable(null)
        verified += productId
        return entitlements
    }
    override suspend fun sync(subjectId: String, purchases: List<OwnedPurchase>) = run { guard(); SyncOutcome(syncResults, entitlements) }
    override suspend fun entitlements(subjectId: String) = run { guard(); entitlements }
}

private class FakePlay : PlayGateway {
    val unsolicited = MutableSharedFlow<List<OwnedPurchase>>(extraBufferCapacity = 4)
    override val unsolicitedPurchases: Flow<List<OwnedPurchase>> = unsolicited
    var owned = emptyList<OwnedPurchase>()
    var outcome: PlayPurchaseOutcome = PlayPurchaseOutcome.Canceled
    var lastSubject: String? = null

    override suspend fun queryProducts(productIds: List<String>) = productIds.map { PlayProduct(it, emptyList(), null) }
    override suspend fun purchase(activity: Activity, product: PlayProduct, offerToken: String?, subjectId: String): PlayPurchaseOutcome {
        lastSubject = subjectId
        return outcome
    }
    override suspend fun ownedSubscriptions() = owned
    override fun close() = Unit
}

class BillingFacadeTest {
    private val api = FakeApi()
    private val play = FakePlay()
    private val store = InMemoryEntitlementStore()

    private fun sdk() = CipherOctoBilling(api, play, store, SUBJECT, clock = { NOW }, scope = CoroutineScope(Dispatchers.Unconfined))

    // Stub Activity from android.jar (returnDefaultValues); the fake gateway ignores it.
    private val activity: Activity = Activity()

    @Test fun startsLockedAndUnlocksOnlyFromServer(): Unit = runBlocking {
        val sdk = sdk()
        assertFalse(sdk.entitlements.value.isActive("premium", NOW))
        sdk.refresh()
        assertTrue(sdk.entitlements.value.isActive("premium", NOW))
    }

    @Test fun purchaseUnlocksAfterServerVerification(): Unit = runBlocking {
        play.outcome = PlayPurchaseOutcome.Purchased(listOf(OwnedPurchase("pro_monthly", "tok")))
        val sdk = sdk()
        val r = sdk.purchase(activity, "pro_monthly")
        assertTrue(r is PurchaseResult.Success)
        assertEquals(listOf("pro_monthly"), api.verified)
        assertEquals(SUBJECT, play.lastSubject)
        assertTrue(sdk.entitlements.value.isActive("premium", NOW))
    }

    @Test fun purchaseWhenVerifierDownDefersAndUnlocksNothing(): Unit = runBlocking {
        play.outcome = PlayPurchaseOutcome.Purchased(listOf(OwnedPurchase("pro_monthly", "tok")))
        api.unavailable = true
        val sdk = sdk()
        val r = sdk.purchase(activity, "pro_monthly")
        assertTrue(r is PurchaseResult.VerificationDeferred)
        assertFalse(sdk.entitlements.value.isActive("premium", NOW))
    }

    @Test fun pendingAndCanceledUnlockNothing(): Unit = runBlocking {
        val sdk = sdk()
        play.outcome = PlayPurchaseOutcome.Pending
        assertTrue(sdk.purchase(activity, "pro_monthly") is PurchaseResult.Pending)
        play.outcome = PlayPurchaseOutcome.Canceled
        assertTrue(sdk.purchase(activity, "pro_monthly") is PurchaseResult.Canceled)
        assertFalse(sdk.entitlements.value.isActive("premium", NOW))
    }

    @Test fun purchaseWithoutSubjectFails(): Unit = runBlocking {
        val sdk = CipherOctoBilling(api, play, store, null, clock = { NOW }, scope = CoroutineScope(Dispatchers.Unconfined))
        val r = sdk.purchase(activity, "pro_monthly")
        assertTrue((r as PurchaseResult.Failed).error is CipherOctoException.NoSubject)
    }

    @Test fun offlineFallsBackToCacheButExpiryStillApplies(): Unit = runBlocking {
        sdk().refresh() // populates cache
        api.offline = true
        val fresh = sdk() // new process
        val r = fresh.refresh()
        assertTrue(r.isOffline)
        assertTrue(r.entitlements.isActive("premium", NOW))
        assertFalse(r.entitlements.isActive("premium", NOW + 2 * 86_400_000))
    }

    @Test fun switchingSubjectNeverLeaksPreviousEntitlements(): Unit = runBlocking {
        val sdk = sdk()
        sdk.refresh()
        sdk.setSubject("another-subject-9999")
        assertFalse(sdk.entitlements.value.isActive("premium", NOW))
    }

    @Test fun rejectedPurchasesAreReported(): Unit = runBlocking {
        play.owned = listOf(OwnedPurchase("pro_monthly", "tok"))
        api.syncResults = listOf(SyncItemResult("pro_monthly", false, "purchase_bound_elsewhere"))
        val r = sdk().refresh()
        assertEquals("purchase_bound_elsewhere", r.rejected.single().reason)
    }
}
