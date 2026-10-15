import { z } from "zod"

// Play subscription ids: lowercase letters, digits, underscore, hyphen, period; ≤ 40 chars.
export const PlayProductId = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9._-]{0,39}$/, "Use the subscription id from Play Console (lowercase, digits, . _ -).")

export const EntitlementKey = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]{0,31}$/, "Use a short key like premium or pro_plus.")

/**
 * An opaque, unguessable id the *app* assigns to its user. Max 64 because the same
 * value is set as Play's obfuscatedAccountId, which Google caps at 64 characters.
 */
export const SubjectId = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9._:@-]{8,64}$/, "subjectId must be 8–64 characters of letters, digits and . _ : @ -")

export const PurchaseToken = z.string().trim().min(10).max(2048)

export const ProductView = z.object({
  id: z.string(),
  productId: z.string(),
  entitlement: z.string(),
  displayName: z.string(),
  description: z.string(),
  status: z.enum(["draft", "active", "archived"]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateProductBody = z.object({
  productId: PlayProductId,
  entitlement: EntitlementKey,
  displayName: z.string().trim().min(1, "Enter a display name.").max(80),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
})

export const UpdateProductBody = z
  .object({
    entitlement: EntitlementKey.optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.")

export const PurchaseState = z.enum(["pending", "active", "canceled", "grace", "on_hold", "paused", "expired", "revoked"])

export const PurchaseResult = z.object({
  productId: z.string(),
  state: PurchaseState,
  entitled: z.boolean(),
  expiresAt: z.string().nullable(),
  autoRenewing: z.boolean(),
})

export const EntitlementResult = z.object({
  key: z.string(),
  active: z.boolean(),
  expiresAt: z.string().nullable(),
})

export const VerifyBody = z.object({
  subjectId: SubjectId,
  productId: PlayProductId,
  purchaseToken: PurchaseToken,
})

export const SyncBody = z.object({
  subjectId: SubjectId,
  purchases: z.array(z.object({ productId: PlayProductId, purchaseToken: PurchaseToken })).min(1).max(20),
})

// ── Real-time Developer Notifications ──────────────────────────────────────

export const PubSubPush = z.object({
  message: z.object({
    data: z.string().min(1),
    messageId: z.string().min(1).max(100),
    publishTime: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
  }),
  subscription: z.string().optional(),
})

/** Lenient on purpose: Google adds fields, and we only read the ones we need. */
export const DeveloperNotification = z.object({
  packageName: z.string().min(1),
  eventTimeMillis: z.string().optional(),
  testNotification: z.object({ version: z.string().optional() }).optional(),
  subscriptionNotification: z
    .object({ notificationType: z.number(), purchaseToken: z.string().min(1), subscriptionId: z.string().min(1) })
    .optional(),
  voidedPurchaseNotification: z
    .object({
      purchaseToken: z.string().min(1),
      orderId: z.string().optional(),
      productType: z.number().optional(),
      refundType: z.number().optional(),
    })
    .optional(),
  oneTimeProductNotification: z.unknown().optional(),
})
