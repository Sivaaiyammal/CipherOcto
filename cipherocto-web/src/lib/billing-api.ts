// Typed client for the billing-setup endpoints under /api/v1/admin
// (apps, SDK keys, product mappings, subscription health). Shapes mirror the
// Zod schemas in cipherocto-api/src/modules/{apps,subscriptions}.

import { api } from "@/lib/api"

export type BackendAppStatus = "development" | "testing" | "production" | "maintenance" | "archived"

export type BackendApp = {
  id: string
  name: string
  packageName: string
  platform: "android"
  status: BackendAppStatus
  owner: string
  techStack: string
  playConsoleUrl: string
  createdAt: string
  updatedAt: string
}

export type SdkKey = {
  id: string
  prefix: string
  label: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export type ProductStatus = "draft" | "active" | "archived"

export type ProductMapping = {
  id: string
  productId: string
  entitlement: string
  displayName: string
  description: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type SubscriptionSummary = {
  states: Record<string, number>
  activeEntitlements: number
  lastVerifiedAt: string | null
  verificationConfigured: boolean
  notificationsConfigured: boolean
}

export type SubscriptionEvent = {
  id: string
  type: string
  source: string
  subjectId: string | null
  at: string
  detail: unknown
}

export const PACKAGE_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/
export const PLAY_PRODUCT_ID_RE = /^[a-z0-9][a-z0-9._-]{0,39}$/
export const ENTITLEMENT_RE = /^[a-z][a-z0-9_]{0,31}$/

const enc = encodeURIComponent

export const billingApi = {
  listApps: (signal?: AbortSignal) => api<{ apps: BackendApp[] }>("/admin/apps", { signal }).then((r) => r.apps),
  createApp: (body: { name: string; packageName: string; owner?: string }) =>
    api<{ app: BackendApp }>("/admin/apps", { method: "POST", body }).then((r) => r.app),

  listKeys: (appId: string, signal?: AbortSignal) =>
    api<{ keys: SdkKey[] }>(`/admin/apps/${enc(appId)}/sdk-keys`, { signal }).then((r) => r.keys),
  createKey: (appId: string, label: string) =>
    api<{ key: SdkKey; secret: string }>(`/admin/apps/${enc(appId)}/sdk-keys`, { method: "POST", body: { label } }),
  revokeKey: (appId: string, keyId: string) =>
    api<void>(`/admin/apps/${enc(appId)}/sdk-keys/${enc(keyId)}`, { method: "DELETE" }),

  listProducts: (appId: string, signal?: AbortSignal) =>
    api<{ products: ProductMapping[] }>(`/admin/apps/${enc(appId)}/products`, { signal }).then((r) => r.products),
  createProduct: (
    appId: string,
    body: { productId: string; entitlement: string; displayName: string; description?: string; status: ProductStatus }
  ) => api<{ product: ProductMapping }>(`/admin/apps/${enc(appId)}/products`, { method: "POST", body }).then((r) => r.product),
  setProductStatus: (appId: string, id: string, status: ProductStatus) =>
    api<{ product: ProductMapping }>(`/admin/apps/${enc(appId)}/products/${enc(id)}`, { method: "PATCH", body: { status } }).then(
      (r) => r.product
    ),

  summary: (appId: string, signal?: AbortSignal) =>
    api<SubscriptionSummary>(`/admin/apps/${enc(appId)}/subscriptions/summary`, { signal }),
  events: (appId: string, signal?: AbortSignal) =>
    api<{ events: SubscriptionEvent[] }>(`/admin/apps/${enc(appId)}/subscriptions/events?limit=25`, { signal }).then(
      (r) => r.events
    ),
}
