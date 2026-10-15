import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import { CreateUserBody, UpdateUserBody, UserIdParams, UserViewSchema } from "./users.schemas.ts"
import type { UsersService } from "./users.service.ts"

/** Mounted under `/api/v1/admin` — dashboard administration only. */
export async function usersRoutes(app: FastifyInstance, opts: { users: UsersService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { users } = opts

  r.get(
    "/users",
    {
      onRequest: requirePermission("team:read"),
      schema: { tags: ["admin: users"], summary: "List team members", response: { 200: z.object({ users: z.array(UserViewSchema) }) } },
    },
    async () => ({ users: await users.list() })
  )

  r.post(
    "/users",
    {
      onRequest: requirePermission("team:manage"),
      schema: { tags: ["admin: users"], summary: "Create a team member", body: CreateUserBody, response: { 201: z.object({ user: UserViewSchema }) } },
    },
    async (request, reply) => {
      const user = await users.create(request.auth!, request.body, request.ip)
      return reply.code(201).send({ user })
    }
  )

  r.patch(
    "/users/:id",
    {
      onRequest: requirePermission("team:manage"),
      schema: {
        tags: ["admin: users"],
        summary: "Change a member's name, role or status",
        params: UserIdParams,
        body: UpdateUserBody,
        response: { 200: z.object({ user: UserViewSchema }) },
      },
    },
    async (request) => ({ user: await users.update(request.auth!, request.params.id, request.body, request.ip) })
  )
}
