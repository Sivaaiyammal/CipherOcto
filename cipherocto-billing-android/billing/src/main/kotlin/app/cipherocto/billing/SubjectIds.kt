package app.cipherocto.billing

import java.security.MessageDigest

/**
 * The subject id is how CipherOcto and Google Play know *whose* purchase this is.
 * It is sent to Google as the obfuscated account id, so it must be opaque and stable.
 */
public object SubjectIds {
    private val VALID = Regex("^[A-Za-z0-9._:@-]{8,64}$")

    /**
     * Derives a subject id from your own user id without exposing it: SHA-256, hex, 40 chars.
     * Use the same [salt] forever (a per-app constant); changing it would orphan purchases.
     */
    @JvmStatic
    @JvmOverloads
    public fun fromAppUserId(userId: String, salt: String = ""): String {
        require(userId.isNotBlank()) { "userId must not be blank." }
        val digest = MessageDigest.getInstance("SHA-256").digest("$salt:$userId".toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }.take(40)
    }

    @JvmStatic
    public fun isValid(subjectId: String): Boolean = VALID.matches(subjectId)
}
