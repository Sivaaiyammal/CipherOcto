import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { requirePermission } from "../../plugins/auth.ts"
import { CreateProductBody, ProductView, UpdateProductBody } from "./subscriptions.schemas.ts"
import type { SubscriptionsService } from "./subscriptions.service.ts"

const AppParams = z.object({ appId: z.string().min(1) })

/** Mounted under `/api/v1/admin`. Responses never contain purchase tokens. */
export async function subscriptionsAdminRoutes(app: FastifyInstance, opts: { subscriptions: SubscriptionsService }) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { subscriptions } = opts
  const tags = ["admin: subscriptions"]

  r.get(
    "/apps/:appId/products",
    {
      onRequest: requirePermission("subscriptions:read"),
      schema: { tags, summary: "Product mappings for an app", params: AppParams, response: { 200: z.object({ products: z.array(ProductView) }) } },
    },
    async (request) => ({ products: await subscriptions.listProducts(request.params.appId) })
  )

  r.post(
    "/apps/:appId/products",
    {
      onRequest: requirePermission("subscriptions:write"),
      schema: {
        tags,
        summary: "Map a Play Console subscription to an entitlement",
        description: "Maps an existing Play Console product. It does not create or change anything in Play Console.",
        params: AppParams,
        body: CreateProductBody,
        response: { 201: z.object({ product: ProductView }) },
      },
    },
    async (request, reply) =>
      reply.code(201).send({ product: await subscriptions.createProduct(request.auth!, request.params.appId, request.body, request.ip) })
  )

  r.patch(
    "/apps/:appId/products/:id",
    {
      onRequest: requirePermission("subscriptions:write"),
      schema: {
        tags,
        summary: "Update a product mapping",
        params: AppParams.extend({ id: z.string().min(1) }),
        body: UpdateProductBody,
        response: { 200: z.object({ product: ProductView }) },
      },
    },
    async (request) => ({
      product: await subscriptions.updateProduct(request.auth!, request.params.appId, request.params.id, request.body, request.ip),
    })
  )

  r.get(
    "/apps/:appId/subscriptions/summary",
    {
      onRequest: requirePermission("subscriptions:read"),
      schema: {
        tags,
        summary: "Subscription health for an app, with data freshness",
        params: AppParams,
        response: {
          200: z.object({
            states: z.record(z.string(), z.number()),
            activeEntitlements: z.number(),
            lastVerifiedAt: z.string().nullable(),
            verificationConfigured: z.boolean(),
            notificationsConfigured: z.boolean(),
          }),
        },
      },
    },
    async (request) => subscriptions.summary(request.params.appId)
  )

  r.get(
    "/apps/:appId/subscriptions/events",
    {
      onRequest: requirePermission("subscriptions:read"),
      schema: {
        tags,
        summary: "Recent subscription lifecycle events",
        params: AppParams,
        querystring: z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }),
        response: {
          200: z.object({
            events: z.array(
              z.object({
                id: z.string(),
                type: z.string(),
                source: z.string(),
                subjectId: z.string().nullable(),
                at: z.string(),
                detail: z.unknown(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const events = await subscriptions.recentEvents(request.params.appId, request.query.limit)
      return { events: events.map((e) => ({ id: e.id, type: e.type, source: e.source, subjectId: e.subjectId, at: e.at, detail: e.detail })) }
    }
  )

  r.post(
    "/subscriptions/reconcile",
    {
      onRequest: requirePermission("subscriptions:write"),
      schema: {
        tags,
        summary: "Re-verify stale purchases with Google now",
        body: z.object({ appId: z.string().optional(), staleMinutes: z.number().min(0).max(10_080).default(0) }),
        response: { 200: z.object({ checked: z.number(), changed: z.number(), failed: z.number() }) },
      },
    },
    async (request) =>
      subscriptions.reconcile({ appId: request.body.appId, staleMs: request.body.staleMinutes * 60_000, limit: 500 })
  )
}
