import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>

// 2^15 keeps login responsive on small hosts while staying above OWASP's interactive minimum.
const N = 2 ** 15
const R = 8
const P = 1
const KEY_LEN = 64

/** `scrypt$N$r$p$salt$hash` — parameters travel with the hash so they can be raised later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: 128 * N * R * 2 })
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$")
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 6 || parts[0] !== "scrypt") return false
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string]
  const expected = Buffer.from(hashB64, "base64")
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummyHash: Promise<string> | undefined
/**
 * A valid hash of a random password, verified when the email is unknown so a
 * missing account costs the same time as a wrong password.
 */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(24).toString("base64url"))
  return dummyHash
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

/** Opaque session token for the cookie; only its SHA-256 is stored server-side. */
export function newSessionToken(): { token: string; id: string } {
  const token = randomBytes(32).toString("base64url")
  return { token, id: hashToken(token) }
}

export const randomPassword = () => randomBytes(24).toString("base64url")
