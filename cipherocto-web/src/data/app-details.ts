// Per-app detail figures. Derived deterministically from the portfolio record
// (seeded by app id) so every app has stable, self-consistent mock data until
// the analytics and store APIs are connected.
import type { PortfolioApp } from "@/data/apps"
import { between, seededRandom } from "@/lib/seeded-random"

export type AppDetail = {
  appCode: string
  categoryLong: string
  mrr: number
  iap: number
  arppu: number
  dau: number
  stickiness: number
  sessions: number
  crashes: number
  anrRate: number
  iosRating: number | null
  androidRating: number | null
  ratingDelta: number
  paywallConversion: number
  paywallUplift: number
  paywallVariant: string
  weeklyTrials: number
  trialToPaid: number
  iosShare: number
  webhookLatency: number
  lastHandshake: string
  refundRate: number
  releaseDaysAgo: number
  capabilities: { label: string; tone: "blue" | "mint" | "amber" | "lavender" }[]
  trends: {
    revenue: number[]
    audience: number[]
    stability: number[]
    paywall: number[]
  }
}

const CATEGORY_LONG: Record<string, string> = {
  Productivity: "Productivity & Routine Optimization",
  Utilities: "Utilities & Focus Tools",
  Education: "Education & Reading",
  "Health & Fitness": "Health, Fitness & Wellbeing",
}

function walk(rand: () => number, points: number, start: number, drift: number, noise: number) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < points; i++) {
    v += drift + (rand() - 0.5) * noise
    out.push(v)
  }
  return out
}

const round = (v: number, digits = 2) => Number(v.toFixed(digits))

export function getAppDetail(app: PortfolioApp): AppDetail {
  const rand = seededRandom(app.id)
  const has = (p: PortfolioApp["platforms"][number]) => app.platforms.includes(p)
  const onApple = app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  const onAndroid = has("android")

  const mrrShare = between(rand, 0.72, 0.84)
  const stickiness = between(rand, 0.18, 0.32)
  const sessions = app.mau * between(rand, 1.15, 1.4)
  const crashes = Math.round(sessions * ((100 - app.crashFree) / 100))
  const paywallConversion = between(rand, 3.2, 6.4)

  const capabilities: AppDetail["capabilities"] = []
  if (onApple) capabilities.push({ label: "StoreKit 2 Enabled", tone: "blue" })
  if (onAndroid) capabilities.push({ label: "Google Play Billing 6.1", tone: "mint" })
  if (has("watchos")) capabilities.push({ label: "WatchOS Complication Sync", tone: "amber" })
  if (has("macos")) capabilities.push({ label: "Mac Catalyst", tone: "amber" })
  if (has("web")) capabilities.push({ label: "Web Checkout", tone: "lavender" })
  if (app.mau > 500_000) {
    capabilities.push({
      label: `Instant App / App Clip ${Math.round((app.mau * 0.03) / 1000)}k`,
      tone: "lavender",
    })
  }

  return {
    appCode: `#${app.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .padEnd(2, "X")}-${Math.floor(between(rand, 10_000, 99_999))}`,
    categoryLong: CATEGORY_LONG[app.category] ?? app.category,
    mrr: app.revenueMonthly * mrrShare,
    iap: app.revenueMonthly * (1 - mrrShare),
    arppu: app.subscribers ? app.revenueMonthly / app.subscribers : 0,
    dau: app.mau * stickiness,
    stickiness,
    sessions,
    crashes,
    anrRate: round((100 - app.crashFree) / between(rand, 2.5, 4), 2),
    iosRating: onApple ? round(Math.min(5, app.rating + between(rand, 0, 0.06))) : null,
    androidRating: onAndroid ? round(Math.min(5, app.rating - between(rand, 0, 0.06))) : null,
    ratingDelta: round(between(rand, 0.02, 0.12)),
    paywallConversion: round(paywallConversion, 1),
    paywallUplift: round(between(rand, 0.2, 0.9), 1),
    paywallVariant: `V${Math.floor(between(rand, 2, 6))}`,
    weeklyTrials: Math.round(app.subscribers * between(rand, 0.1, 0.14)),
    trialToPaid: Math.round(between(rand, 62, 78)),
    iosShare: onApple && onAndroid ? Math.round(between(rand, 55, 72)) : onApple ? 100 : 0,
    webhookLatency: round(between(rand, 0.8, 1.6), 1),
    lastHandshake: `${Math.floor(between(rand, 2, 30))}s ago`,
    refundRate: round(between(rand, 0.3, 0.7), 2),
    releaseDaysAgo: Math.floor(between(rand, 5, 12)),
    capabilities,
    trends: {
      revenue: walk(rand, 14, 40, 1.4, 4),
      audience: walk(rand, 14, 30, 1.1, 3),
      stability: walk(rand, 14, app.crashFree - 0.08, 0.006, 0.03),
      paywall: walk(rand, 14, paywallConversion - 0.6, 0.05, 0.3),
    },
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

/** Last 30 days of daily values for the Monetization & Acquisition Pulse. */
export function getPulseSeries(
  app: PortfolioApp,
  metric: PulseMetric,
  releaseDaysAgo: number,
  today = new Date()
): PulsePoint[] {
  const rand = seededRandom(`${app.id}:${metric}`)
  const daily = {
    revenue: app.revenueMonthly / 30,
    installs: app.installs30d / 30,
    subscribers: (app.subscribers * 0.045) / 30,
  }[metric]

  const raw = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (29 - i))
    const daysAgo = 29 - i
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const afterRelease = daysAgo <= releaseDaysAgo
    const value =
      daily *
      0.82 *
      (isWeekend ? between(rand, 1.2, 1.38) : between(rand, 0.9, 1.06)) *
      (afterRelease ? 1.16 : 1) *
      (1 + i * 0.006)
    return { date, isWeekend, isRelease: daysAgo === releaseDaysAgo, value }
  })

  return raw.map((p, i) => {
    const window = raw.slice(Math.max(0, i - 6), i + 1)
    return {
      ...p,
      label: p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      trend: window.reduce((s, w) => s + w.value, 0) / window.length,
    }
  })
}

export type ScopedFlag = {
  key: string
  description: string
  enabled: boolean
}

/** Flags scoped to one app; the first few are shown on the detail page. */
export function getScopedFlags(app: PortfolioApp): ScopedFlag[] {
  const ios = app.platforms.includes("ios")
  const flags: ScopedFlag[] = [
    {
      key: "enable_ai_summary",
      description: ios ? "iOS ≥ 17.2 • 90% allocation" : "Android ≥ 12 • 90% allocation",
      enabled: true,
    },
    { key: "onboarding_v4_paywall", description: "A/B Test active (50/50 split)", enabled: true },
    { key: "haptic_feedback_engine", description: "Global 100% rollout", enabled: true },
    { key: "black_friday_precache", description: "Armed for Nov 24, 00:00 UTC", enabled: false },
  ]
  return flags.slice(0, Math.min(flags.length, app.configFlags))
}
