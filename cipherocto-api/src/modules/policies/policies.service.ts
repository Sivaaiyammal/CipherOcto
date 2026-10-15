import { badRequest, notFound } from "../../shared/errors.ts"
import type { AuthContext } from "../../shared/auth-context.ts"
import type { AppRecord } from "../apps/apps.repository.ts"
import type { AppsService } from "../apps/apps.service.ts"
import type { AuditService } from "../audit/audit.service.ts"
import { isBlankPolicy, renderNotFoundPage, renderPolicyPage, sanitizePolicyHtml } from "./policy-html.ts"
import type { PoliciesRepository, PolicyKind } from "./policies.repository.ts"

const KIND: PolicyKind = "privacy"

export class PoliciesService {
  private readonly repo: PoliciesRepository
  private readonly apps: AppsService
  private readonly audit: AuditService

  constructor(deps: { repo: PoliciesRepository; apps: AppsService; audit: AuditService }) {
    this.repo = deps.repo
    this.apps = deps.apps
    this.audit = deps.audit
  }

  /** The app, its live policy and the version history, for the dashboard. */
  async overview(appId: string) {
    const app = await this.apps.get(appId)
    const [current, versions] = await Promise.all([this.repo.latest(app.id, KIND), this.repo.versions(app.id, KIND)])
    return { app, publicPath: `/${app.slug}/privacy`, current, versions }
  }

  async version(appId: string, version: number) {
    const app = await this.apps.get(appId)
    const found = await this.repo.byVersion(app.id, KIND, version)
    if (!found) throw notFound("That version doesn't exist.")
    return found
  }

  /**
   * Publishes `rawHtml` as the next version; it is live immediately. Re-publishing
   * identical content is a no-op so a double-click never creates a duplicate version.
   */
  async publish(actor: AuthContext, appId: string, rawHtml: string, ip: string) {
    const app = await this.apps.get(appId)
    const html = sanitizePolicyHtml(rawHtml)
    if (isBlankPolicy(html)) {
      throw badRequest("empty_policy", "That file has no visible content once unsafe markup is removed.")
    }

    const live = await this.repo.latest(app.id, KIND)
    if (live && live.html === html) return { policy: live, unchanged: true }

    const policy = await this.repo.publish(app.id, KIND, html, { id: actor.user.id, email: actor.user.email })
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "app.privacy_policy_published",
      target: app.packageName,
      ip,
      detail: { version: policy.version, slug: app.slug },
    })
    return { policy, unchanged: false }
  }

  /** What `/<slug>/privacy` serves: a full HTML document, or null when unpublished. */
  async renderPublic(slug: string): Promise<{ app: AppRecord; page: string } | null> {
    const app = await this.apps.bySlug(slug)
    if (!app) return null
    const policy = await this.repo.latest(app.id, KIND)
    if (!policy) return null
    return { app, page: renderPolicyPage({ appName: app.name, kind: KIND, html: policy.html }) }
  }

  notFoundPage() {
    return renderNotFoundPage()
  }
}
