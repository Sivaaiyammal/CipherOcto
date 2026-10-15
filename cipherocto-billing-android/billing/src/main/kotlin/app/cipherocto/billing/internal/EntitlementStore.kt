package app.cipherocto.billing.internal

import android.content.Context
import app.cipherocto.billing.Entitlement
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

internal data class CachedEntitlements(val entitlements: List<Entitlement>, val verifiedAtMillis: Long)

/**
 * Last-known-good entitlements, so a paid user isn't locked out by a flaky connection.
 * The cache is only ever written from a server response, and is keyed by subject.
 * Expiry is re-evaluated on read, so it can't extend access past the paid period.
 */
internal interface EntitlementStore {
    fun load(subjectId: String): CachedEntitlements?
    fun save(subjectId: String, value: CachedEntitlements)
    fun clear(subjectId: String)
}

internal class InMemoryEntitlementStore : EntitlementStore {
    private val data = mutableMapOf<String, CachedEntitlements>()
    override fun load(subjectId: String) = data[subjectId]
    override fun save(subjectId: String, value: CachedEntitlements) { data[subjectId] = value }
    override fun clear(subjectId: String) { data.remove(subjectId) }
}

@Serializable private class StoredEntitlement(val key: String, val active: Boolean, val expiresAtMillis: Long? = null)
@Serializable private class StoredSnapshot(val verifiedAtMillis: Long, val entitlements: List<StoredEntitlement>)

internal class SharedPrefsEntitlementStore(context: Context) : EntitlementStore {
    private val prefs = context.applicationContext.getSharedPreferences("cipherocto_billing", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    private fun keyFor(subjectId: String) = "entitlements.$subjectId"

    override fun load(subjectId: String): CachedEntitlements? {
        val raw = prefs.getString(keyFor(subjectId), null) ?: return null
        return runCatching {
            val s = json.decodeFromString<StoredSnapshot>(raw)
            CachedEntitlements(s.entitlements.map { Entitlement(it.key, it.active, it.expiresAtMillis) }, s.verifiedAtMillis)
        }.getOrNull()
    }

    override fun save(subjectId: String, value: CachedEntitlements) {
        val snapshot = StoredSnapshot(value.verifiedAtMillis, value.entitlements.map { StoredEntitlement(it.key, it.active, it.expiresAtMillis) })
        prefs.edit().putString(keyFor(subjectId), json.encodeToString(StoredSnapshot.serializer(), snapshot)).apply()
    }

    override fun clear(subjectId: String) {
        prefs.edit().remove(keyFor(subjectId)).apply()
    }
}
