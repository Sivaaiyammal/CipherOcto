import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"

import type { Config } from "../../config.ts"
import { AppError } from "../../shared/errors.ts"
import type { PushAuthenticator } from "./play.ts"
import { DeveloperNotification, PubSubPush } from "./subscriptions.schemas.ts"
import type { SubscriptionsService } from "./subscriptions.service.ts"

/**
 * Google Play Real-time Developer Notifications, delivered by a Pub/Sub push subscription.
 * Mounted at `/api/v1/webhooks`.
 *
 * Contract with Pub/Sub: any 2xx acknowledges; anything else is retried with backoff.
 * So we answer 2xx for every message we have *dealt with* (including ones we can't
 * use) and 5xx only for transient failures, relying on idempotent processing for retries.
 */
export async function webhookRoutes(
  app: FastifyInstance,
  opts: { subscriptions: SubscriptionsService; pushAuth: PushAuthenticator; config: Config }
) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const { subscriptions, pushAuth, config } = opts

  r.post(
    "/google-play",
    {
      // Authenticate before parsing anything: an unauthenticated push gets nothing from us.
      onRequest: async (request) => {
        if (!config.rtdn) {
          throw new AppError(503, "notifications_unavailable", "Play notifications aren't configured.")
        }
        if (!(await pushAuth.verify(request.headers.authorization))) {
          throw new AppError(401, "unauthenticated", "Invalid push credentials.")
        }
      },
      // Pub/Sub retries aggressively; a modest cap keeps a misbehaving sender cheap.
      config: { rateLimit: { max: 600, timeWindow: "1 minute" } },
      schema: { tags: ["webhooks"], summary: "Google Play RTDN (Pub/Sub push)", body: PubSubPush },
    },
    async (request, reply) => {
      const { message } = request.body

      let parsed: ReturnType<typeof DeveloperNotification.safeParse>
      try {
        parsed = DeveloperNotification.safeParse(JSON.parse(Buffer.from(message.data, "base64").toString("utf8")))
      } catch {
        parsed = DeveloperNotification.safeParse(undefined)
      }
      if (!parsed.success) {
        // A message we can never parse will never succeed on retry: acknowledge and move on.
        request.log.warn({ messageId: message.messageId }, "RTDN message could not be parsed; acknowledged")
        return reply.code(204).send()
      }

      const n = parsed.data
      await subscriptions.handleNotification({
        messageId: message.messageId,
        packageName: n.packageName,
        eventTimeMillis: n.eventTimeMillis,
        testNotification: n.testNotification,
        subscriptionNotification: n.subscriptionNotification,
        voidedPurchaseNotification: n.voidedPurchaseNotification,
        oneTimeProductNotification: n.oneTimeProductNotification,
      })
      return reply.code(204).send()
    }
  )
}
