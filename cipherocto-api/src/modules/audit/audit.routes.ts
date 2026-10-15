import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import type { AuditService } from "./audit.service.ts"

const EventView = z.object({
  id: z.string(),
  at: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().nullable().optional(),
  action: z.string(),
  target: z.string().nullable(),
  ip: z.string().nullable(),
  detail: z.unknown(),
})

export async function auditRoutes(app: FastifyInstance, opts: { audit: AuditService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()

  r.get(
    "/audit",
    {
      onRequest: requirePermission("audit:read"),
      schema: {
        tags: ["admin: audit"],
        summary: "Most recent security events",
        querystring: z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }),
        response: { 200: z.object({ events: z.array(EventView) }) },
      },
    },
    async (request) => ({ events: await opts.audit.recent(request.query.limit) })
  )
}
