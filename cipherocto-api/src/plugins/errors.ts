import type { FastifyInstance } from "fastify"
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod"

import { AppError } from "../shared/errors.ts"

/**
 * One error shape for the whole API:
 *   { error: "machine_code", message: "Human text", requestId, ...extra }
 * Internal details never reach the client; they go to the (redacted) log.
 */
export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({ error: "not_found", message: "Not found.", requestId: request.id })
  )

  app.setErrorHandler((error: unknown, request, reply) => {
    const requestId = request.id

    if (error instanceof AppError) {
      const retry = error.extra.retryAfterSeconds
      if (typeof retry === "number") reply.header("Retry-After", String(retry))
      return reply.code(error.status).send({ error: error.code, message: error.message, requestId, ...error.extra })
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const issues = error.validation.map((v) => ({
        path: String(v.instancePath ?? "").replace(/^\//, "").replace(/\//g, "."),
        message: v.message ?? "Invalid value.",
      }))
      return reply.code(400).send({
        error: "validation_error",
        message: issues[0]?.message ?? "Invalid request.",
        issues,
        requestId,
      })
    }

    if (isResponseSerializationError(error)) {
      request.log.error({ err: error }, "response did not match its schema")
      return reply.code(500).send({ error: "internal_error", message: "Something went wrong.", requestId })
    }

    const e = error as { statusCode?: number; code?: string; message?: string; retryAfterSeconds?: number }
    if (e.statusCode === 429) {
      if (e.retryAfterSeconds) reply.header("Retry-After", String(e.retryAfterSeconds))
      return reply.code(429).send({
        error: "too_many_requests",
        message: e.message ?? "Too many requests. Slow down.",
        retryAfterSeconds: e.retryAfterSeconds,
        requestId,
      })
    }
    if (typeof e.statusCode === "number" && e.statusCode >= 400 && e.statusCode < 500) {
      // Fastify's own client errors: bad JSON, payload too large, unsupported media type…
      return reply.code(e.statusCode).send({ error: "bad_request", message: e.message ?? "Bad request.", requestId })
    }

    request.log.error({ err: error }, "unhandled error")
    return reply.code(500).send({ error: "internal_error", message: "Something went wrong.", requestId })
  })
}
