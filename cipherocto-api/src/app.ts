import fastifyEnv from "@fastify/env"
import Fastify, { type FastifyInstance } from "fastify"
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod"

import { envSchema, toConfig, type Config, type RawEnv } from "./config.ts"
import { accessRoutes } from "./modules/access/access.routes.ts"
import { auditRoutes } from "./modules/audit/audit.routes.ts"
import { authRoutes } from "./modules/auth/auth.routes.ts"
import { usersRoutes } from "./modules/users/users.routes.ts"
import { connectDatabase, type Database } from "./plugins/database.ts"
import { registerRequestAuth } from "./plugins/auth.ts"
import { registerDocs } from "./plugins/docs.ts"
import { registerErrorHandling } from "./plugins/errors.ts"
import { registerSecurity } from "./plugins/security.ts"
import { createServices, type Services } from "./services.ts"

declare module "fastify" {
  interface FastifyInstance {
    settings: Config
    services: Services
    /** Models and connection; used by services via repositories and by tests. */
    db: Database
  }
}

/**
 * Builds the app without binding a port, so tests can create isolated instances
 * with `app.inject()`. Config comes from `env` (defaults to `process.env`).
 *
 * Layout (see SKILL.md §3 / §6):
 *   /api/v1/health            public
 *   /api/v1/auth/*            sign-in, session, password
 *   /api/v1/admin/*           dashboard administration (own auth + schemas)
 *   /api/v1/sdk/*             reserved for the mobile SDK (separate auth & limits)
 */
export async function buildApp(opts: { env?: Record<string, string | undefined> } = {}): Promise<FastifyInstance> {
  const env = opts.env ?? process.env
  const isTest = env.NODE_ENV === "test"

  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: env.NODE_ENV === "production" ? "info" : "debug",
          // Secrets, tokens and salary data must never reach the logs.
          redact: {
            paths: [
              "req.headers.cookie",
              "req.headers.authorization",
              'res.headers["set-cookie"]',
              "*.password",
              "*.currentPassword",
              "*.newPassword",
              "*.passwordHash",
              "*.token",
              "*.purchaseToken",
              "*.salary",
            ],
            censor: "[redacted]",
          },
        },
    trustProxy: env.TRUST_PROXY === "true",
    bodyLimit: 32 * 1024,
  })

  await app.register(fastifyEnv, { schema: envSchema, data: env, confKey: "rawEnv" })
  const config = toConfig((app as unknown as { getEnvs: () => RawEnv }).getEnvs())
  app.decorate("settings", config)

  // Zod schemas drive validation, serialization (no accidental field leaks) and OpenAPI.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const database = await connectDatabase(config)
  app.decorate("db", database)
  app.addHook("onClose", async () => database.close())

  const services = createServices(config, database.models, app.log)
  await services.access.syncSystemRoles()
  app.decorate("services", services)

  registerErrorHandling(app)
  await registerSecurity(app, config)
  await registerDocs(app, config.docsEnabled)
  registerRequestAuth(app, { resolve: (token) => services.auth.resolve(token), webOrigins: config.webOrigins })

  await app.register(
    async (v1) => {
      v1.get("/health", { config: { rateLimit: false } }, async () => ({ ok: true }))

      await v1.register(authRoutes, { prefix: "/auth", auth: services.auth, config })

      // Dashboard administration. Mobile SDK routes will live in a sibling plugin
      // (`/sdk`) with their own authentication, schemas and stricter limits.
      await v1.register(
        async (admin) => {
          await admin.register(usersRoutes, { users: services.users })
          await admin.register(accessRoutes, { access: services.access })
          await admin.register(auditRoutes, { audit: services.audit })
        },
        { prefix: "/admin" }
      )
    },
    { prefix: "/api/v1" }
  )

  return app
}
