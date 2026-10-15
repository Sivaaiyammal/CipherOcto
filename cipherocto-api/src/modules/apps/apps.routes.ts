import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import type { AppsService } from "./apps.service.ts"

// Android application ids: dot-separated Java identifiers, at least two segments.
const PackageName = z
  .string()
  .trim()
  .max(150)
  .regex(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, "Use a package name like com.company.app.")

const Status = z.enum(["development", "testing", "production", "maintenance", "archived"])

const AppView = z.object({
  id: z.string(),
  name: z.string(),
  packageName: z.string(),
  slug: z.string(),
  platform: z.literal("android"),
  status: Status,
  owner: z.string(),
  techStack: z.string(),
  playConsoleUrl: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const KeyView = z.object({
  id: z.string(),
  prefix: z.string(),
  label: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
})

const CreateAppBody = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  packageName: PackageName,
  /** Public URL name; derived from the app name when omitted. */
  slug: z.string().trim().max(40).optional(),
  status: Status.optional(),
  owner: z.string().trim().max(120).optional(),
  techStack: z.string().trim().max(200).optional(),
  playConsoleUrl: z.string().trim().max(500).optional(),
})

const UpdateAppBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(2).max(40).optional(),
    status: Status.optional(),
    owner: z.string().trim().max(120).optional(),
    techStack: z.string().trim().max(200).optional(),
    playConsoleUrl: z.string().trim().max(500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.")

const AppParams = z.object({ appId: z.string().min(1) })

/** Mounted under `/api/v1/admin`. */
export async function appsRoutes(app: FastifyInstance, opts: { apps: AppsService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { apps } = opts
  const tags = ["admin: apps"]

  r.get(
    "/apps",
    { onRequest: requirePermission("apps:read"), schema: { tags, summary: "List registered apps", response: { 200: z.object({ apps: z.array(AppView) }) } } },
    async () => ({ apps: await apps.list() })
  )

  r.post(
    "/apps",
    {
      onRequest: requirePermission("apps:write"),
      schema: { tags, summary: "Register an app", body: CreateAppBody, response: { 201: z.object({ app: AppView }) } },
    },
    async (request, reply) => reply.code(201).send({ app: await apps.create(request.auth!, request.body, request.ip) })
  )

  r.get(
    "/apps/:appId",
    {
      onRequest: requirePermission("apps:read"),
      schema: { tags, summary: "Get an app", params: AppParams, response: { 200: z.object({ app: AppView }) } },
    },
    async (request) => ({ app: await apps.get(request.params.appId) })
  )

  r.patch(
    "/apps/:appId",
    {
      onRequest: requirePermission("apps:write"),
      schema: { tags, summary: "Update an app", params: AppParams, body: UpdateAppBody, response: { 200: z.object({ app: AppView }) } },
    },
    async (request) => ({ app: await apps.update(request.auth!, request.params.appId, request.body, request.ip) })
  )

  // SDK keys are credentials, so managing them needs write access.
  r.get(
    "/apps/:appId/sdk-keys",
    {
      onRequest: requirePermission("apps:write"),
      schema: { tags, summary: "List an app's SDK keys (hashes only)", params: AppParams, response: { 200: z.object({ keys: z.array(KeyView) }) } },
    },
    async (request) => ({ keys: await apps.listKeys(request.params.appId) })
  )

  r.post(
    "/apps/:appId/sdk-keys",
    {
      onRequest: requirePermission("apps:write"),
      schema: {
        tags,
        summary: "Create an SDK key. The secret is shown once.",
        params: AppParams,
        body: z.object({ label: z.string().trim().max(80).default("") }),
        response: { 201: z.object({ key: KeyView, secret: z.string() }) },
      },
    },
    async (request, reply) => {
      const created = await apps.createKey(request.auth!, request.params.appId, request.body.label, request.ip)
      return reply.code(201).send({ key: created.key, secret: created.secret })
    }
  )

  r.delete(
    "/apps/:appId/sdk-keys/:keyId",
    {
      onRequest: requirePermission("apps:write"),
      schema: { tags, summary: "Revoke an SDK key", params: AppParams.extend({ keyId: z.string().min(1) }) },
    },
    async (request, reply) => {
      await apps.revokeKey(request.auth!, request.params.appId, request.params.keyId, request.ip)
      return reply.code(204).send()
    }
  )
}
