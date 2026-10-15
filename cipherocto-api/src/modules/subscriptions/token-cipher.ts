import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * AES-256-GCM for purchase tokens at rest. We must keep the token to re-query
 * Google during reconciliation, but a database leak must not expose live tokens.
 *
 * Format: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 */
export function encryptToken(key: Buffer, token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".")
}

export function decryptToken(key: Buffer, stored: string): string {
  const [version, iv, tag, ct] = stored.split(".")
  if (version !== "v1" || !iv || !tag || !ct) throw new Error("Unsupported token ciphertext")
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8")
}
