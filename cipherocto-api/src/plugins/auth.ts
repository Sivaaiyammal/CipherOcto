import type { FastifyInstance, onRequestAsyncHookHandler } from "fastify"

import type { Permission } from "../modules/access/permissions.ts"
import type { AuthContext } from "../shared/auth-context.ts"
import { AppError, forbidden, unauthenticated } from "../shared/errors.ts"
import { SESSION_COOKIE } from "../shared/session-cookie.ts"

declare module "fastify" {
  interface FastifyRequest {
    /** Set by the session hook; null when the caller is anonymous. */
    auth: AuthContext | null
  }
}

/**
 * Resolves the session cookie into `request.auth` and enforces the Origin
 * allow-list on writes. Authorization itself is declared per route with
 * `requireAuth` / `requirePermission`, so every protected route says what it needs.
 */
export function registerRequestAuth(
  app: FastifyInstance,
  opts: { resolve: (token: string) => Promise<AuthContext | null>; webOrigins: string[] }
) {
  app.decorateRequest("auth", null)

  app.addHook("onRequest", async (request) => {
    // CSRF defence in depth on top of SameSite=Lax: refuse cross-origin writes.
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.origin
      if (origin && !opts.webOrigins.includes(origin)) {
        throw new AppError(403, "origin_not_allowed", "Cross-origin request blocked.")
      }
    }

    const token = request.cookies[SESSION_COOKIE]
    if (token) request.auth = await opts.resolve(token)
  })
}

/**
 * Guards run in `onRequest` — before body parsing and validation — so an anonymous
 * caller always gets 401 and never learns anything from validation errors.
 */
export const requireAuth: onRequestAsyncHookHandler = async (request) => {
  if (!request.auth) throw unauthenticated()
}

/** Requires every listed permission: 401 when signed out, 403 when signed in but not allowed. */
export function requirePermission(...needed: Permission[]): onRequestAsyncHookHandler {
  return async (request) => {
    if (!request.auth) throw unauthenticated()
    const missing = needed.filter((p) => !request.auth!.permissions.has(p))
    if (missing.length) throw forbidden("Your role doesn't allow this.", { required: missing })
  }
}
