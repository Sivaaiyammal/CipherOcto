package app.cipherocto.billing

import okhttp3.OkHttpClient

/**
 * @param baseUrl Where the CipherOcto API lives, e.g. `https://api.company.com`. Must be HTTPS;
 *   cleartext is only accepted for `localhost` and the emulator's `10.0.2.2` during development.
 * @param sdkKey This app's key (`octo_sdk_…`) from the CipherOcto dashboard. It identifies the app
 *   and can be revoked; it is not a secret and carries no authority over purchases.
 * @param subjectId Your user's stable, opaque id, if already known. Can also be set later with
 *   [CipherOctoBilling.setSubject]. See [SubjectIds.fromAppUserId].
 * @param httpClient Supply to share a connection pool or add certificate pinning.
 * @param logger Receives diagnostic lines. Never receives purchase tokens.
 */
public data class CipherOctoConfig(
    public val baseUrl: String,
    public val sdkKey: String,
    public val subjectId: String? = null,
    public val httpClient: OkHttpClient? = null,
    public val logger: ((String) -> Unit)? = null,
) {
    init {
        require(sdkKey.startsWith("octo_sdk_")) { "sdkKey must be an octo_sdk_… key from the CipherOcto dashboard." }
        val url = baseUrl.trim().lowercase()
        val development = url.startsWith("http://localhost") || url.startsWith("http://10.0.2.2") || url.startsWith("http://127.0.0.1")
        require(url.startsWith("https://") || development) {
            "baseUrl must use https:// (http:// is only allowed for localhost / 10.0.2.2)."
        }
    }
}
