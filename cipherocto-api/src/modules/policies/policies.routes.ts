import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import { SLUG_RE } from "../../shared/slug.ts"
import type { PoliciesService } from "./policies.service.ts"
import { POLICY_CSP } from "./policy-html.ts"

const MAX_HTML_CHARS = 500_000

const VersionView = z.object({
  version: z.number(),
  publishedAt: z.string(),
  publishedByEmail: z.string().nullable(),
})
const PolicyView = VersionView.extend({ html: z.string() })

const AppParams = z.object({ appId: z.string().min(1) })

/** Mounted under `/api/v1/admin`. */
export async function policiesAdminRoutes(app: FastifyInstance, opts: { policies: PoliciesService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { policies } = opts
  const tags = ["admin: policies"]

  r.get(
    "/apps/:appId/policies/privacy",
    {
      onRequest: requirePermission("apps:read"),
      schema: {
        tags,
        summary: "The app's live privacy policy and its version history",
        params: AppParams,
        response: {
          200: z.object({
            slug: z.string(),
            publicPath: z.string(),
            current: PolicyView.nullable(),
            versions: z.array(VersionView),
          }),
        },
      },
    },
    async (request) => {
      const o = await policies.overview(request.params.appId)
      return { slug: o.app.slug, publicPath: o.publicPath, current: o.current, versions: o.versions }
    }
  )

  r.get(
    "/apps/:appId/policies/privacy/versions/:version",
    {
      onRequest: requirePermission("apps:read"),
      schema: {
        tags,
        summary: "One historical version, including its HTML",
        params: AppParams.extend({ version: z.coerce.number().int().min(1) }),
        response: { 200: z.object({ policy: PolicyView }) },
      },
    },
    async (request) => ({ policy: await policies.version(request.params.appId, request.params.version) })
  )

  // Publishing is immediate: there is no draft step, so it needs write access.
  r.put(
    "/apps/:appId/policies/privacy",
    {
      onRequest: requirePermission("apps:write"),
      bodyLimit: 1024 * 1024,
      schema: {
        tags,
        summary: "Publish a privacy policy (HTML). Sanitized, versioned, live immediately.",
        params: AppParams,
        body: z.object({ html: z.string().min(1, "Add the policy HTML.").max(MAX_HTML_CHARS, "That file is too large (500,000 characters max).") }),
        response: { 200: z.object({ policy: PolicyView, unchanged: z.boolean(), publicPath: z.string() }) },
      },
    },
    async (request) => {
      const { policy, unchanged } = await policies.publish(request.auth!, request.params.appId, request.body.html, request.ip)
      const o = await policies.overview(request.params.appId)
      return { policy, unchanged, publicPath: o.publicPath }
    }
  )
}

/**
 * The public page, mounted at the server root: `GET /:slug/privacy`.
 * Served from the database on every request, so a new upload is live without a restart.
 */
export async function policiesPublicRoutes(app: FastifyInstance, opts: { policies: PoliciesService }) {
  const { policies } = opts

  const send404 = (reply: import("fastify").FastifyReply) =>
    reply
      .code(404)
      .header("content-type", "text/html; charset=utf-8")
      .header("content-security-policy", POLICY_CSP)
      .header("x-robots-tag", "noindex")
      .send(policies.notFoundPage())

  app.get<{ Params: { slug: string } }>(
    "/:slug/privacy",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const slug = request.params.slug.toLowerCase()
      if (!SLUG_RE.test(slug)) return send404(reply)

      const found = await policies.renderPublic(slug)
      if (!found) return send404(reply)

      return reply
        .code(200)
        .header("content-type", "text/html; charset=utf-8")
        .header("content-security-policy", POLICY_CSP)
        .header("referrer-policy", "no-referrer")
        .send(found.page)
    }
  )
}
