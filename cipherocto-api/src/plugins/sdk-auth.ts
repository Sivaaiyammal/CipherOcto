import type { FastifyInstance, onRequestAsyncHookHandler } from "fastify"

import type { AppRecord } from "../modules/apps/apps.repository.ts"
import { AppError } from "../shared/errors.ts"

declare module "fastify" {
  interface FastifyRequest {
    /** Set by the SDK guard: the app the presented key belongs to. */
    sdkApp: AppRecord | null
  }
}

export const SDK_KEY_HEADER = "x-octo-sdk-key"

/**
 * SDK routes authenticate with a per-app key, never with a dashboard session.
 *
 * The key ships inside the mobile app, so it is *not* a secret: it only says which
 * app is asking, and lets us rate-limit and revoke per app. Authority over a purchase
 * always comes from Google's verification, never from possessing the key.
 */
export function createSdkGuard(app: FastifyInstance, resolve: (key: string) => Promise<AppRecord | null>): onRequestAsyncHookHandler {
  if (!app.hasRequestDecorator("sdkApp")) app.decorateRequest("sdkApp", null)

  return async (request) => {
    const presented = request.headers[SDK_KEY_HEADER]
    const key = Array.isArray(presented) ? presented[0] : presented
    const found = key ? await resolve(key) : null
    if (!found) throw new AppError(401, "invalid_sdk_key", "Missing or invalid SDK key.")
    request.sdkApp = found
  }
}
