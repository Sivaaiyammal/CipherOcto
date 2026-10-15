import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import type { FastifyInstance } from "fastify"
import { jsonSchemaTransform } from "fastify-type-provider-zod"

import { SESSION_COOKIE } from "../shared/session-cookie.ts"

/**
 * OpenAPI generated from the same Zod route schemas that validate requests, so the
 * docs can't drift from the code. Mounted at /api/v1/docs when `API_DOCS` is on.
 *
 * `swagger` must be registered before any route so it can see them.
 */
export async function registerDocs(app: FastifyInstance, enabled: boolean) {
  await app.register(swagger, {
    openapi: {
      info: { title: "CipherOcto API", description: "Management platform API (v1).", version: "1.0.0" },
      servers: [{ url: "/" }],
      components: { securitySchemes: { session: { type: "apiKey", in: "cookie", name: SESSION_COOKIE } } },
      security: [{ session: [] }],
    },
    transform: jsonSchemaTransform,
  })
  if (enabled) await app.register(swaggerUi, { routePrefix: "/api/v1/docs" })
}
