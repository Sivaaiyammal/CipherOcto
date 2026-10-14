// Deeper per-app sections for the app detail page (catalog, releases, ASO,
// sentiment, environments). Derived from the portfolio record and AppDetail so
// numbers stay consistent with the KPI tiles; seeded per app for stability.
import type { AppDetail } from "@/data/app-details"
import type { PortfolioApp } from "@/data/apps"
import { between, hashString, seededRandom } from "@/lib/seeded-random"

const onApple = (app: PortfolioApp) =>
  app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
const onAndroid = (app: PortfolioApp) => app.platforms.includes("android")

/** Snap a price to the familiar .99 ending. */
function storePrice(value: number) {
  return Math.max(0.99, Math.round(value) - 0.01)
}

// ── Catalog SKUs ────────────────────────────────────────────────────────────

export type SkuKind = "subscription" | "non-consumable" | "consumable"

export type CatalogSku = {
  id: string
  name: string
  kind: SkuKind
  tone: "mint" | "blue" | "amber" | "pink"
  icon: "annual" | "monthly" | "lifetime" | "pack"
  price: number
  period?: "yr" | "mo"
  priceNote: string
  volume: string
  volumeNote: string
  monthlyRevenue: number
  revenueShare: number
  apple: boolean
  android: boolean
}

export function getCatalog(app: PortfolioApp, detail: AppDetail): CatalogSku[] {
  const rand = seededRandom(`${app.id}:catalog`)
  const slug = app.id.slice(0, 6)
  const annualSubs = Math.round(app.subscribers * between(rand, 0.68, 0.76))
  const monthlySubs = app.subscribers - annualSubs

  // Monthly plans cost ~2x the annual plan's per-month rate. Solve for the
  // annual price that reproduces the app's MRR from its subscriber mix:
  //   annualSubs * Pa/12 + monthlySubs * k * Pa/12 = mrr
  const k = between(rand, 1.8, 2.2)
  const mix = annualSubs + k * monthlySubs
  // New apps have no subscribers yet: fall back to list prices
  const annualPrice = mix > 0 ? storePrice((12 * detail.mrr) / mix) : 49.99
  const monthlyPrice = storePrice((k * annualPrice) / 12)
  const annualRevenue = (annualSubs * annualPrice) / 12
  const monthlyRevenue = monthlySubs * monthlyPrice

  const lifetimePrice = storePrice(annualPrice * 2.4)
  const packPrice = 2.99
  const lifetimeUnits = Math.round((detail.iap * between(rand, 0.8, 0.88)) / lifetimePrice)
  const lifetimeRevenue = lifetimeUnits * lifetimePrice
  const packUnits = Math.max(0, Math.round((detail.iap - lifetimeRevenue) / packPrice))
  const packRevenue = packUnits * packPrice

  const total = annualRevenue + monthlyRevenue + lifetimeRevenue + packRevenue
  const apple = onApple(app)
  const android = onAndroid(app)
  const priceCode = (p: number) => String(Math.round(p * 100)).padStart(4, "0")

  return [
    {
      id: `sub_annual_${priceCode(annualPrice)}_${slug}`,
      name: `${app.name} Annual`,
      kind: "subscription",
      tone: "mint",
      icon: "annual",
      price: annualPrice,
      period: "yr",
      priceNote: `$${(annualPrice / 12).toFixed(2)} / month`,
      volume: `${annualSubs.toLocaleString("en-US")} active`,
      volumeNote: `+${Math.round(annualSubs * between(rand, 0.04, 0.07)).toLocaleString("en-US")} this week`,
      monthlyRevenue: annualRevenue,
      revenueShare: total ? (annualRevenue / total) * 100 : 0,
      apple,
      android,
    },
    {
      id: `sub_monthly_${priceCode(monthlyPrice)}_${slug}`,
      name: `${app.name} Monthly`,
      kind: "subscription",
      tone: "blue",
      icon: "monthly",
      price: monthlyPrice,
      period: "mo",
      priceNote: "Auto-renewing",
      volume: `${monthlySubs.toLocaleString("en-US")} active`,
      volumeNote: "Steady retention",
      monthlyRevenue,
      revenueShare: total ? (monthlyRevenue / total) * 100 : 0,
      apple,
      android,
    },
    {
      id: `iap_lifetime_${priceCode(lifetimePrice)}_${slug}`,
      name: "Lifetime Unlimited Pass",
      kind: "non-consumable",
      tone: "amber",
      icon: "lifetime",
      price: lifetimePrice,
      priceNote: "Non-consumable",
      volume: `${lifetimeUnits.toLocaleString("en-US")} sold`,
      volumeNote: "This 30d window",
      monthlyRevenue: lifetimeRevenue,
      revenueShare: total ? (lifetimeRevenue / total) * 100 : 0,
      apple,
      android,
    },
    {
      id: `iap_pack_themes_${priceCode(packPrice)}_${slug}`,
      name: "Custom Themes & Widgets Pack",
      kind: "consumable",
      tone: "pink",
      icon: "pack",
      price: packPrice,
      priceNote: "Consumable pack",
      volume: `${packUnits.toLocaleString("en-US")} units`,
      volumeNote: `+${Math.round(packUnits * 0.2).toLocaleString("en-US")} viral shares`,
      monthlyRevenue: packRevenue,
      revenueShare: total ? (packRevenue / total) * 100 : 0,
      apple,
      android,
    },
  ]
}

// ── Release pipeline ────────────────────────────────────────────────────────

export type PipelineBuild = {
  version: string
  build: number
  stage: "production" | "candidate"
  badges: { label: string; tone: "mint" | "blue" | "outline" }[]
  summary: string
  facts: { label: string; value: string; tone?: "mint" | "danger" }[]
}

function bumpMinor(version: string) {
  const [major, minor] = version.split(".").map(Number)
  return `${major}.${(minor ?? 0) + 1}.0`
}

function releaseNotes(app: PortfolioApp) {
  const notes = ["haptic fixes", "faster cold start", "localized Japanese onboarding"]
  if (app.platforms.includes("watchos")) notes.unshift("WatchOS widget sync optimization")
  else if (app.platforms.includes("web")) notes.unshift("web checkout hardening")
  else notes.unshift("background sync reliability")
  return notes.slice(0, 3)
}

export function getReleasePipeline(app: PortfolioApp, detail: AppDetail): PipelineBuild[] {
  const rand = seededRandom(`${app.id}:pipeline`)
  const deployed = new Date()
  deployed.setDate(deployed.getDate() - detail.releaseDaysAgo)
  const deployedLabel = deployed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const [first, ...rest] = releaseNotes(app)

  const productionBadge =
    app.status.kind === "live"
      ? { label: "Production 100% Complete", tone: "mint" as const }
      : app.status.kind === "staged"
        ? { label: `Phased Rollout ${app.status.rollout}%`, tone: "blue" as const }
        : { label: "Awaiting Store Review", tone: "outline" as const }

  const current: PipelineBuild = {
    version: app.version,
    build: app.build,
    stage: "production",
    badges: [productionBadge],
    summary: `Deployed ${deployedLabel} • ${first[0].toUpperCase()}${first.slice(1)}, ${rest.join(", and ")}.`,
    facts: [
      { label: "Crash Rate", value: `${(100 - app.crashFree).toFixed(2)}%`, tone: "mint" },
      {
        label: "Session Length",
        value: `${Math.floor(between(rand, 3, 6))}m ${String(Math.floor(between(rand, 0, 60))).padStart(2, "0")}s`,
      },
      { label: "Adoption", value: `${between(rand, 78, 95).toFixed(1)}% of install base` },
    ],
  }

  const candidateBadges: PipelineBuild["badges"] = []
  if (onApple(app)) candidateBadges.push({ label: "Apple App Store Approved", tone: "blue" })
  if (onAndroid(app)) candidateBadges.push({ label: "Google Internal Tested", tone: "outline" })

  const candidate: PipelineBuild = {
    version: bumpMinor(app.version),
    build: app.build + Math.floor(between(rand, 4, 9)),
    stage: "candidate",
    badges: candidateBadges,
    summary: `Ready for 10% phased rollout • Resolves the top reported issue for ${Math.floor(between(rand, 20, 80))} power users.`,
    facts: [
      { label: "Targeting", value: "10% first 24h" },
      { label: "Auto-Halt Threshold", value: "> 0.25% crash rate", tone: "danger" },
      { label: "SDK Security Audit", value: "Zero vulnerabilities", tone: "mint" },
    ],
  }

  return [current, candidate]
}

// ── Metadata & ASO ─────────────────────────────────────────────────────────

const KEYWORDS: Record<string, string[]> = {
  Productivity: ["Daily Habit Tracker", "Morning Routine Organizer", "Streak Counter Habit"],
  Utilities: ["Focus Timer Pomodoro", "Deep Work Blocker", "Study Session Timer"],
  Education: ["AI Book Summaries", "Speed Reading Coach", "Daily Learning Bites"],
  "Health & Fitness": ["Sleep Sounds Relax", "Calorie Counter Macro", "Wellness Tracker"],
}

const LOCALES = [
  "en-US", "ja-JP", "de-DE", "fr-FR", "es-ES", "pt-BR", "ko-KR", "it-IT", "zh-CN",
  "zh-TW", "nl-NL", "sv-SE", "pl-PL", "tr-TR", "ru-RU", "ar-SA", "hi-IN", "id-ID",
]

export type AsoInsights = {
  locales: string[]
  localized: number
  keywords: { term: string; rank: string; top: boolean }[]
  appClip: { launches: number; installRate: number } | null
}

export function getAso(app: PortfolioApp): AsoInsights {
  const rand = seededRandom(`${app.id}:aso`)
  const count = Math.max(6, Math.min(LOCALES.length, Math.round(app.mau / 80_000)))
  const markets = ["US / UK", "Global", "DE / JP", "BR / ES", "KR / JP"]
  return {
    locales: LOCALES.slice(0, count),
    localized: count,
    keywords: (KEYWORDS[app.category] ?? KEYWORDS.Productivity).map((term, i) => {
      const rank = Math.max(1, Math.round(between(rand, 1, 4) + i * between(rand, 0.5, 3) + (app.mau < 300_000 ? 6 : 0)))
      return { term, rank: `#${rank} Rank ${markets[i % markets.length]}`, top: rank === 1 }
    }),
    appClip:
      app.mau > 500_000
        ? { launches: Math.round(app.mau * between(rand, 0.025, 0.035)), installRate: Math.round(between(rand, 22, 34)) }
        : null,
  }
}

// ── Sentiment ──────────────────────────────────────────────────────────────

export type SentimentInsights = {
  positive: number
  neutral: number
  negative: number
  review: { stars: number; author: string; ago: string; text: string }
  issue: { title: string; reports: number; note: string }
}

export function getSentiment(app: PortfolioApp, nextBuild: { version: string; build: number }): SentimentInsights | null {
  if (app.ratingCount === 0) return null
  const rand = seededRandom(`${app.id}:sentiment`)
  const positive = Math.round(Math.min(97, 60 + (app.rating - 4) * 38))
  const negative = Math.max(1, Math.round((100 - positive) * between(rand, 0.25, 0.4)))
  const authors = ["@dev_sarah", "@mika.codes", "@runner_jo", "@leo_reads", "@nightowl_ana"]
  const watch = app.platforms.includes("watchos")
  return {
    positive,
    neutral: 100 - positive - negative,
    negative,
    review: {
      stars: Math.round(app.rating),
      author: authors[hashString(app.id) % authors.length],
      ago: `${Math.floor(between(rand, 1, 9))}h ago`,
      text: `The new update in v${app.version} is incredible! ${app.name} has become part of my daily routine — seamless across all my devices.`,
    },
    issue: {
      title: watch ? "WatchOS Complication Battery Draw" : "Sync Delay on Slow Networks",
      reports: Math.floor(between(rand, 12, 60)),
      note: `Fixed in v${nextBuild.version} build #${nextBuild.build}, pending release.`,
    },
  }
}

// ── Environments ───────────────────────────────────────────────────────────

export function getBuildHash(app: PortfolioApp) {
  return hashString(`${app.id}@${app.version}+${app.build}`).toString(16).padStart(8, "0")
}
