// Per-app detail figures for the app detail page.
//
// Nothing here is synthesized. Values come from the registry (platforms, category)
// and from the subscription backend (verification / RTDN status, active entitlements,
// product mappings). Metrics that need Google Play reporting or analytics (revenue,
// DAU, crash rate, ratings, paywall conversion…) are `null` and series are empty, so
// the cards render "—" / an inline hint until those integrations exist.
import * as React from "react"

import type { PortfolioApp } from "@/data/apps"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import { billingApi, type ProductMapping, type SubscriptionSummary } from "@/lib/billing-api"

export type AppDetail = {
  /** The public URL name, shown where the design had a generated "App ID". */
  appCode: string
  categoryLong: string
  mrr: number | null
  iap: number | null
  arppu: number | null
  dau: number | null
  stickiness: number | null
  sessions: number | null
  crashes: number | null
  anrRate: number | null
  iosRating: number | null
  androidRating: number | null
  ratingDelta: number | null
  paywallConversion: number | null
  paywallUplift: number | null
  paywallVariant: string | null
  weeklyTrials: number | null
  trialToPaid: number | null
  /** Share of the store audience on Apple platforms; known only from the platform list. */
  iosShare: number | null
  /** Platforms the app ships on, for labels when shares are unknown. */
  platformNames: string[]
  /** Play billing / RTDN status from the subscription backend; null until loaded. */
  notificationsConfigured: boolean | null
  verificationConfigured: boolean | null
  lastVerifiedAt: string | null
  refundRate: number | null
  releaseDaysAgo: number | null
  capabilities: { label: string; tone: "blue" | "mint" | "amber" | "lavender" }[]
  trends: {
    revenue: number[]
    audience: number[]
    stability: number[]
    paywall: number[]
  }
}

function platformInfo(app: PortfolioApp) {
  const onApple = app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  const onAndroid = app.platforms.includes("android")
  // Only a single-store app has a knowable split (100/0).
  const iosShare = onApple && onAndroid ? null : onApple ? 100 : 0
  const platformNames = [onApple ? "iOS" : null, onAndroid ? "Android" : null].filter((n): n is string => n !== null)
  return { onApple, onAndroid, iosShare, platformNames }
}

export function buildAppDetail(app: PortfolioApp, summary: SubscriptionSummary | null): AppDetail {
  const { onApple, onAndroid, iosShare, platformNames } = platformInfo(app)

  const capabilities: AppDetail["capabilities"] = []
  if (onApple) capabilities.push({ label: "App Store", tone: "blue" })
  if (onAndroid) capabilities.push({ label: "Google Play Billing", tone: "mint" })
  if (app.platforms.includes("watchos")) capabilities.push({ label: "WatchOS", tone: "amber" })
  if (app.platforms.includes("web")) capabilities.push({ label: "Web Checkout", tone: "lavender" })
  if (summary?.verificationConfigured) capabilities.push({ label: "Purchase verification on", tone: "mint" })
  if (summary?.notificationsConfigured) capabilities.push({ label: "Play RTDN on", tone: "lavender" })

  return {
    appCode: app.slug,
    categoryLong: app.category || "Uncategorized",
    mrr: null,
    iap: null,
    arppu: null,
    dau: null,
    stickiness: null,
    sessions: null,
    crashes: null,
    anrRate: null,
    iosRating: null,
    androidRating: null,
    ratingDelta: null,
    paywallConversion: null,
    paywallUplift: null,
    paywallVariant: null,
    weeklyTrials: null,
    trialToPaid: null,
    iosShare,
    platformNames,
    notificationsConfigured: summary ? summary.notificationsConfigured : null,
    verificationConfigured: summary ? summary.verificationConfigured : null,
    lastVerifiedAt: summary?.lastVerifiedAt ?? null,
    refundRate: null,
    releaseDaysAgo: null,
    capabilities,
    trends: { revenue: [], audience: [], stability: [], paywall: [] },
  }
}

export type PulseMetric = "revenue" | "installs" | "subscribers"

export type PulsePoint = {
  date: Date
  label: string
  value: number
  /** 7-day moving average */
  trend: number
  isWeekend: boolean
  isRelease: boolean
}

/**
 * Daily series for the Monetization & Acquisition Pulse. Needs Google Play
 * reporting (not imported yet), so there are no points to draw.
 */
export function getPulseSeries(): PulsePoint[] {
  return []
}

export type ScopedFlag = {
  key: string
  description: string
  enabled: boolean
}

/** Needs the remote-config module (not built yet). */
export function getScopedFlags(): ScopedFlag[] {
  return []
}

// ── Live data hook ─────────────────────────────────────────────────────────

export type AppDetailData = {
  detail: AppDetail
  summary: SubscriptionSummary | null
  products: ProductMapping[]
  /** Whether the role may see subscription data at all. */
  canSeeBilling: boolean
  loading: boolean
  error: string | null
  reload: () => void
}

/** Loads the subscription summary and product mappings for one app. */
export function useAppDetail(app: PortfolioApp): AppDetailData {
  const { can } = useAuth()
  const canSeeBilling = can("subscriptions:read")
  const appId = app.id

  const [tick, setTick] = React.useState(0)
  // Results are keyed by the request that produced them, so switching apps (or
  // reloading) reads as "loading" without resetting state inside the effect.
  const key = `${appId}:${tick}`
  const [result, setResult] = React.useState<{
    key: string
    summary: SubscriptionSummary | null
    products: ProductMapping[]
    error: string | null
  } | null>(null)

  React.useEffect(() => {
    if (!canSeeBilling) return
    const ctrl = new AbortController()
    Promise.all([billingApi.summary(appId, ctrl.signal), billingApi.listProducts(appId, ctrl.signal)])
      .then(([summary, products]) => setResult({ key, summary, products, error: null }))
      .catch((e) => {
        if (ctrl.signal.aborted) return
        setResult({
          key,
          summary: null,
          products: [],
          error: e instanceof ApiError ? e.message : "Couldn't load subscription data.",
        })
      })
    return () => ctrl.abort()
  }, [appId, canSeeBilling, key])

  const current = result?.key === key ? result : null
  const summary = current?.summary ?? null
  const products = React.useMemo(() => current?.products ?? [], [current])
  const error = current?.error ?? null
  const loading = canSeeBilling && current === null

  const detail = React.useMemo(() => buildAppDetail(app, summary), [app, summary])

  return { detail, summary, products, canSeeBilling, loading, error, reload: () => setTick((t) => t + 1) }
}
