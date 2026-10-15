import { randomBytes } from "node:crypto"

import { hashToken } from "../../shared/crypto.ts"
import { notFound } from "../../shared/errors.ts"
import type { AuthContext } from "../../shared/auth-context.ts"
import type { AuditService } from "../audit/audit.service.ts"
import type { AppRecord, AppsRepository, AppStatus, SdkKeyRecord } from "./apps.repository.ts"

const KEY_PREFIX = "octo_sdk_"
const TOUCH_INTERVAL_MS = 5 * 60_000

export class AppsService {
  private readonly repo: AppsRepository
  private readonly audit: AuditService
  private readonly touched = new Map<string, number>()

  constructor(deps: { repo: AppsRepository; audit: AuditService }) {
    this.repo = deps.repo
    this.audit = deps.audit
  }

  list() {
    return this.repo.list()
  }

  async get(id: string): Promise<AppRecord> {
    const app = await this.repo.byId(id)
    if (!app) throw notFound("App not found.")
    return app
  }

  async create(
    actor: AuthContext,
    input: { name: string; packageName: string; status?: AppStatus; owner?: string; techStack?: string; playConsoleUrl?: string },
    ip: string
  ) {
    const app = await this.repo.create({
      name: input.name,
      packageName: input.packageName,
      status: input.status ?? "development",
      owner: input.owner ?? "",
      techStack: input.techStack ?? "",
      playConsoleUrl: input.playConsoleUrl ?? "",
    })
    await this.audit.record({ actorId: actor.user.id, actorEmail: actor.user.email, action: "app.created", target: app.packageName, ip })
    return app
  }

  async update(
    actor: AuthContext,
    id: string,
    patch: { name?: string; status?: AppStatus; owner?: string; techStack?: string; playConsoleUrl?: string },
    ip: string
  ) {
    const app = await this.get(id)
    await this.repo.update(app.id, patch)
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "app.updated",
      target: app.packageName,
      ip,
      detail: { from: { status: app.status, name: app.name }, to: patch },
    })
    return this.get(id)
  }

  // ── SDK keys ───────────────────────────────────────────────────────────

  listKeys(appId: string): Promise<SdkKeyRecord[]> {
    return this.repo.keysForApp(appId)
  }

  /** The secret is returned exactly once; only its hash is stored. */
  async createKey(actor: AuthContext, appId: string, label: string, ip: string) {
    const app = await this.get(appId)
    const secret = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`
    const key = await this.repo.createKey({
      id: hashToken(secret),
      appId: app.id,
      prefix: secret.slice(0, KEY_PREFIX.length + 6),
      label,
      createdBy: actor.user.id,
    })
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "app.sdk_key_created",
      target: app.packageName,
      ip,
      detail: { prefix: key.prefix, label },
    })
    return { key, secret }
  }

  async revokeKey(actor: AuthContext, appId: string, keyId: string, ip: string) {
    const app = await this.get(appId)
    const revoked = await this.repo.revokeKey(app.id, keyId)
    if (!revoked) throw notFound("Key not found or already revoked.")
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "app.sdk_key_revoked",
      target: app.packageName,
      ip,
      detail: { keyId: keyId.slice(0, 8) },
    })
  }

  /** Maps a presented key to its app, or null if unknown, revoked, or the app is archived. */
  async resolveSdkKey(presented: string): Promise<AppRecord | null> {
    if (!presented.startsWith(KEY_PREFIX) || presented.length > 128) return null
    const id = hashToken(presented)
    const key = await this.repo.keyById(id)
    if (!key || key.revokedAt) return null

    const app = await this.repo.byId(key.appId)
    if (!app || app.status === "archived") return null

    const last = this.touched.get(id) ?? 0
    if (Date.now() - last > TOUCH_INTERVAL_MS) {
      this.touched.set(id, Date.now())
      void this.repo.touchKey(id).catch(() => undefined) // best-effort; must never reject unhandled
    }
    return app
  }
}
