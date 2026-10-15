import type { FastifyInstance, FastifyReply } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import type { Config } from "../../config.ts"
import { requireAuth } from "../../plugins/auth.ts"
import { SESSION_COOKIE } from "../../shared/session-cookie.ts"
import { ROLE_DEFINITIONS } from "../access/permissions.ts"
import { AuthConfigResponse, ChangePasswordBody, DemoBody, LoginBody, SessionUserSchema } from "./auth.schemas.ts"
import type { AuthService, Issued } from "./auth.service.ts"

function setSessionCookie(reply: FastifyReply, config: Config, issued: Issued) {
  reply.setCookie(SESSION_COOKIE, issued.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    // "Remember me" survives browser restarts; otherwise it's a session cookie.
    ...(issued.remember ? { maxAge: Math.floor(issued.ttlMs / 1000) } : {}),
  })
}

/** Mounted under `/api/v1/auth`. */
export async function authRoutes(app: FastifyInstance, opts: { auth: AuthService; config: Config }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { auth, config } = opts
  const origin = (req: { ip: string; headers: Record<string, string | string[] | undefined> }) => ({
    ip: req.ip,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
  })

  r.get(
    "/config",
    { schema: { tags: ["auth"], summary: "Which sign-in options the server offers", response: { 200: AuthConfigResponse } } },
    async () => ({
      demoLogin: config.demoLogin,
      demoRoles: config.demoLogin ? ROLE_DEFINITIONS.map((role) => ({ id: role.id, label: role.label })) : [],
    })
  )

  r.post(
    "/login",
    {
      // Per-IP cap on top of the per-account failure throttle in the service.
      config: { rateLimit: { max: config.loginMaxAttempts * 6, timeWindow: config.loginWindowMs } },
      schema: {
        tags: ["auth"],
        summary: "Sign in with email and password",
        body: LoginBody,
        response: { 200: z.object({ user: SessionUserSchema }) },
      },
    },
    async (request, reply) => {
      const issued = await auth.login(request.body, origin(request))
      setSessionCookie(reply, config, issued)
      return { user: issued.user }
    }
  )

  // Exists only when DEMO_LOGIN is on; the service answers 404 otherwise.
  r.post(
    "/demo",
    {
      schema: { tags: ["auth"], summary: "One-click demo sign-in (development only)", body: DemoBody, response: { 200: z.object({ user: SessionUserSchema }) } },
    },
    async (request, reply) => {
      const issued = await auth.demoLogin(request.body, origin(request))
      setSessionCookie(reply, config, issued)
      return { user: issued.user }
    }
  )

  r.get(
    "/me",
    {
      onRequest: requireAuth,
      schema: { tags: ["auth"], summary: "The signed-in user and their permissions", response: { 200: z.object({ user: SessionUserSchema }) } },
    },
    async (request) => ({ user: await auth.sessionUser(request.auth!.user) })
  )

  r.post("/logout", { schema: { tags: ["auth"], summary: "End the session" } }, async (request, reply) => {
    await auth.logout(request.auth, request.ip)
    reply.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: config.cookieSecure, path: "/" })
    return reply.code(204).send()
  })

  r.post(
    "/change-password",
    { onRequest: requireAuth, schema: { tags: ["auth"], summary: "Change your password and sign out other devices", body: ChangePasswordBody } },
    async (request, reply) => {
      await auth.changePassword(request.auth!, request.body, request.ip)
      return reply.code(204).send()
    }
  )
}
