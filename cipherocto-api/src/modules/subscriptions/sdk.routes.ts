import type { FastifyInstance, onRequestAsyncHookHandler } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { SDK_KEY_HEADER } from "../../plugins/sdk-auth.ts"
import { EntitlementResult, PurchaseResult, SubjectId, SyncBody, VerifyBody } from "./subscriptions.schemas.ts"
import type { SubscriptionsService } from "./subscriptions.service.ts"

/**
 * The public mobile-SDK surface, mounted at `/api/v1/sdk`.
 * Separate from `/admin`: different auth (app key), tighter limits, tiny responses.
 * Nothing here ever returns a purchase token.
 */
export async function sdkRoutes(app: FastifyInstance, opts: { subscriptions: SubscriptionsService; guard: onRequestAsyncHookHandler }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { subscriptions, guard } = opts
  const tags = ["sdk"]

  // Limits are per app key, so one noisy app can't starve the rest.
  const limit = (max: number) => ({
    rateLimit: {
      max,
      timeWindow: "1 minute",
      keyGenerator: (req: { headers: Record<string, unknown>; ip: string }) => String(req.headers[SDK_KEY_HEADER] ?? req.ip),
    },
  })

  r.get(
    "/products",
    {
      onRequest: guard,
      config: limit(120),
      schema: {
        tags,
        summary: "Active subscription products for this app",
        response: {
          200: z.object({
            products: z.array(z.object({ productId: z.string(), entitlement: z.string(), displayName: z.string(), description: z.string() })),
          }),
        },
      },
    },
    async (request) => {
      const products = await subscriptions.sdkProducts(request.sdkApp!)
      return {
        products: products.map((p) => ({ productId: p.productId, entitlement: p.entitlement, displayName: p.displayName, description: p.description })),
      }
    }
  )

  r.post(
    "/purchases/verify",
    {
      onRequest: guard,
      config: limit(60),
      schema: {
        tags,
        summary: "Verify a Play purchase with Google and grant the entitlement",
        body: VerifyBody,
        response: { 200: z.object({ purchase: PurchaseResult, entitlements: z.array(EntitlementResult) }) },
      },
    },
    async (request) => subscriptions.verifyPurchase(request.sdkApp!, request.body)
  )

  r.post(
    "/purchases/sync",
    {
      onRequest: guard,
      config: limit(30),
      schema: {
        tags,
        summary: "Restore: verify every purchase the device reports",
        body: SyncBody,
        response: {
          200: z.object({
            results: z.array(z.object({ productId: z.string(), ok: z.boolean(), state: z.string().optional(), error: z.string().optional() })),
            entitlements: z.array(EntitlementResult),
          }),
        },
      },
    },
    async (request) => subscriptions.syncPurchases(request.sdkApp!, request.body)
  )

  r.get(
    "/entitlements",
    {
      onRequest: guard,
      config: limit(120),
      schema: {
        tags,
        summary: "Current entitlements for a subject",
        querystring: z.object({ subjectId: SubjectId }),
        response: { 200: z.object({ entitlements: z.array(EntitlementResult) }) },
      },
    },
    async (request) => ({ entitlements: await subscriptions.entitlementsFor(request.sdkApp!, request.query.subjectId) })
  )
}
