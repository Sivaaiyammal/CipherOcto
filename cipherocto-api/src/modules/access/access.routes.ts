import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import type { AccessService } from "./access.service.ts"

const RoleView = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
})

export async function accessRoutes(app: FastifyInstance, opts: { access: AccessService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()

  r.get(
    "/roles",
    {
      onRequest: requirePermission("team:read"),
      schema: {
        tags: ["admin: access"],
        summary: "List roles and the permission catalogue",
        response: { 200: z.object({ roles: z.array(RoleView), permissions: z.array(z.object({ id: z.string(), description: z.string() })) }) },
      },
    },
    async () => ({ roles: await opts.access.listRoles(), permissions: opts.access.catalog() })
  )
}
