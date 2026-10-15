import {
  PlayVerificationError,
  type PlaySubscription,
  type PlayVerifier,
  type PushAuthenticator,
} from "./play.ts"

/**
 * In-memory stand-in for Google Play, for tests and for building SDK clients offline.
 * It is never wired in automatically: the app only uses it when injected explicitly.
 */
export class FakePlayVerifier implements PlayVerifier {
  private readonly subs = new Map<string, PlaySubscription>()
  readonly acknowledgements: { packageName: string; productId: string }[] = []
  /** Set to make every call fail the way a Google outage would. */
  failWith: PlayVerificationError | null = null
  calls = 0

  private key = (packageName: string, token: string) => `${packageName}|${token}`

  /** Registers (or replaces) what Google would answer for this purchase token. */
  set(packageName: string, token: string, sub: Partial<PlaySubscription> & { productId: string }): PlaySubscription {
    const full: PlaySubscription = {
      state: "active",
      playState: "SUBSCRIPTION_STATE_ACTIVE",
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
      autoRenewing: true,
      acknowledged: false,
      orderId: "GPA.0000-0000-0000-00000",
      linkedPurchaseToken: null,
      obfuscatedAccountId: null,
      testPurchase: false,
      ...sub,
    }
    this.subs.set(this.key(packageName, token), full)
    return full
  }

  async getSubscription(packageName: string, token: string): Promise<PlaySubscription> {
    this.calls++
    if (this.failWith) throw this.failWith
    const sub = this.subs.get(this.key(packageName, token))
    if (!sub) throw new PlayVerificationError("not_found", "Google doesn't recognise this purchase.")
    return { ...sub }
  }

  async acknowledge(packageName: string, productId: string, token: string): Promise<void> {
    if (this.failWith) throw this.failWith
    const sub = this.subs.get(this.key(packageName, token))
    if (sub) sub.acknowledged = true
    this.acknowledgements.push({ packageName, productId })
  }
}

/** Accepts a push only when it carries `Bearer <expected>`. */
export class FakePushAuthenticator implements PushAuthenticator {
  private readonly token: string

  constructor(token = "valid-push-token") {
    this.token = token
  }

  async verify(header: string | undefined): Promise<boolean> {
    return header === `Bearer ${this.token}`
  }
}
