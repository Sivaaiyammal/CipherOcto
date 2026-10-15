// Deeper per-app sections for the app detail page (catalog, releases, ASO,
// sentiment, environments).
//
// The catalog is REAL: it is built from the app's Google Play product mappings
// (billing backend). Releases, ASO and sentiment have no backend yet, so they are
// empty — the cards keep their layout and show an inline hint instead of numbers.
import type { ProductMapping, ProductStatus } from "@/lib/billing-api"

// ── Catalog SKUs ────────────────────────────────────────────────────────────

export type SkuKind = "subscription" | "non-consumable" | "consumable"

export type CatalogSku = {
  id: string
  name: string
  kind: SkuKind
  tone: "mint" | "blue" | "amber" | "pink"
  icon: "annual" | "monthly" | "lifetime" | "pack"
  /** Prices live in the Play Console, not in CipherOcto → null. */
  price: number | null
  period?: "yr" | "mo"
  priceNote: string
  volume: string
  volumeNote: string
  /** Needs Play earnings reports (not imported yet) → null. */
  monthlyRevenue: number | null
  revenueShare: number | null
  apple: boolean
  android: boolean
}

const STATUS_TONE: Record<ProductStatus, CatalogSku["tone"]> = { active: "mint", draft: "blue", archived: "amber" }
const STATUS_NOTE: Record<ProductStatus, string> = {
  active: "Active in app",
  draft: "Draft · not offered yet",
  archived: "Archived",
}

/** Product mappings → catalog rows. Play subscriptions are all that is mapped today. */
export function catalogFromProducts(products: ProductMapping[]): CatalogSku[] {
  return products.map((p) => ({
    id: p.productId,
    name: p.displayName,
    kind: "subscription",
    tone: STATUS_TONE[p.status],
    icon: "monthly",
    price: null,
    priceNote: `Entitlement: ${p.entitlement}`,
    volume: "—",
    volumeNote: STATUS_NOTE[p.status],
    monthlyRevenue: null,
    revenueShare: null,
    apple: false,
    android: true,
  }))
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

/** Needs the releases module (not built yet): no builds are tracked. */
export const NO_BUILDS: PipelineBuild[] = []

// ── Metadata & ASO ─────────────────────────────────────────────────────────

export type AsoInsights = {
  locales: string[]
  localized: number
  keywords: { term: string; rank: string; top: boolean }[]
  appClip: { launches: number; installRate: number } | null
}

/** Needs Play listing / ASO integration (not built yet). */
export const NO_ASO: AsoInsights = { locales: [], localized: 0, keywords: [], appClip: null }

// ── Sentiment ──────────────────────────────────────────────────────────────

export type SentimentInsights = {
  positive: number
  neutral: number
  negative: number
  review: { stars: number; author: string; ago: string; text: string }
  issue: { title: string; reports: number; note: string }
}

// ── Environments ───────────────────────────────────────────────────────────

/** A build hash needs real build records (releases module); until then there is none. */
export function getBuildHash(): string | null {
  return null
}
