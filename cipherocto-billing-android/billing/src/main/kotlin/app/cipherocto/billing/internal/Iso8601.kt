package app.cipherocto.billing.internal

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/** The server emits UTC instants (`2026-10-15T17:56:23.646Z`). Avoids java.time so minSdk can stay low. */
internal object Iso8601 {
    private val patterns = listOf("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd'T'HH:mm:ss'Z'")

    fun parseMillis(value: String): Long? {
        for (p in patterns) {
            val fmt = SimpleDateFormat(p, Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
                isLenient = false
            }
            val parsed = runCatching { fmt.parse(value) }.getOrNull()
            if (parsed != null) return parsed.time
        }
        return null
    }
}
