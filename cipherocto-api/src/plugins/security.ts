import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import sensible from "@fastify/sensible"
import type { FastifyInstance } from "fastify"

import type { Config } from "../config.ts"

/** Secure headers, CORS allow-list, cookies and the default per-IP rate limit. */
export async function registerSecurity(app: FastifyInstance, config: Config) {
  await app.register(sensible)
  await app.register(cookie)
  await app.register(cors, {
    origin: config.webOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
  // Swagger UI needs inline scripts; CSP only matters for HTML, and the docs are dev-only.
  await app.register(helmet, { contentSecurityPolicy: config.docsEnabled ? false : undefined })

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
    // Routes tighten this with `config: { rateLimit: {...} }`.
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      message: `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} second(s).`,
      retryAfterSeconds: Math.ceil(context.ttl / 1000),
    }),
  })

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("Cache-Control", "no-store")
    return payload
  })
}
