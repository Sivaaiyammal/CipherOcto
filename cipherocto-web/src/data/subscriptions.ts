// Subscriptions & IAP catalog, paywall variants and store events.
// In-memory sample data until the store APIs are connected.

export type ProductKind = "auto-renewable" | "non-consumable" | "consumable" | "promo"
export type Store = "apple" | "google" | "stripe"
export type Term = "wk" | "mo" | "yr" | "once"

export type Product = {
  id: string
  appId: string
  name: string
  productId: string
  kind: ProductKind
  badge?: string
  price: number
  term: Term
  stores: Store[]
  storefronts?: number
  status: "active" | "review" | "draft"
  /** subscribers / buyers / orders depending on kind */
  count: number
  countLabel: string
  /** monthly revenue (amortized for one-time products) */
  mrr: number
  trial: string
  trialNote: string
  priceTest?: { price: number; split: number }
}

export const KIND_LABEL: Record<ProductKind, string> = {
  "auto-renewable": "Auto-Renewable",
  "non-consumable": "One-Time IAP",
  consumable: "One-Time IAP",
  promo: "Promos",
}

export const TERM_LABEL: Record<Term, string> = { wk: "/ wk", mo: "/ mo", yr: "/ yr", once: "" }

export const STORE_LABEL: Record<Store, string> = { apple: "App Store", google: "Google Play", stripe: "Stripe Web" }

export const SEED_PRODUCTS: Product[] = [
  { id: "s1", appId: "habitocto", name: "HabitOcto Pro Annual", productId: "com.octo.habits.pro.annual", kind: "auto-renewable", badge: "BESTSELLER", price: 49.99, term: "yr", stores: ["apple", "google", "stripe"], storefronts: 175, status: "active", count: 14_200, countLabel: "subs", mrr: 43_200, trial: "14-Day Free Trial", trialNote: "Family Sharing ON" },
  { id: "s2", appId: "habitocto", name: "HabitOcto Pro Monthly", productId: "com.octo.habits.pro.monthly", kind: "auto-renewable", badge: "AUTO-RENEW", price: 9.99, term: "mo", stores: ["apple", "google"], status: "active", count: 5_200, countLabel: "subs", mrr: 15_100, trial: "3-Day Trial", trialNote: "Intro Promo Active" },
  { id: "s3", appId: "zenreader", name: "ZenReader AI Lifetime", productId: "com.octo.zen.lifetime", kind: "non-consumable", badge: "NON-CONSUMABLE", price: 149.99, term: "once", stores: ["apple", "stripe"], status: "active", count: 1_840, countLabel: "buyers", mrr: 7_700, trial: "No Trial (Paywall Hero)", trialNote: "Family Library Sync" },
  { id: "s4", appId: "focuspulse", name: "FocusPulse Team Tier", productId: "com.octo.focus.team.annual", kind: "auto-renewable", badge: "5 SEATS", price: 199.99, term: "yr", stores: ["stripe"], status: "active", count: 850, countLabel: "org teams", mrr: 14_100, trial: "30-Day Org Pilot", trialNote: "SAML SSO Included" },
  { id: "s5", appId: "sleepocto", name: "SleepOcto 10 Soundpacks", productId: "com.octo.sleep.pack10", kind: "consumable", badge: "CONSUMABLE", price: 4.99, term: "once", stores: ["apple", "google"], status: "active", count: 4_210, countLabel: "orders", mrr: 21_000, trial: "Instant Balance Top-up", trialNote: "No Expiration" },
  { id: "s6", appId: "focuspulse", name: "FocusPulse Pro Monthly", productId: "com.octo.focus.pro.monthly", kind: "auto-renewable", price: 7.99, term: "mo", stores: ["apple", "stripe"], status: "active", count: 4_100, countLabel: "subs", mrr: 26_400, trial: "7-Day Trial", trialNote: "Upgrade path to Team" },
  { id: "s7", appId: "zenreader", name: "ZenReader AI Annual", productId: "com.octo.zen.pro.annual", kind: "auto-renewable", price: 39.99, term: "yr", stores: ["apple", "google"], status: "active", count: 5_400, countLabel: "subs", mrr: 15_800, trial: "7-Day Trial", trialNote: "AI credits included" },
  { id: "s8", appId: "sleepocto", name: "SleepOcto Premium Monthly", productId: "com.octo.sleep.premium.monthly", kind: "auto-renewable", price: 5.99, term: "mo", stores: ["google"], status: "active", count: 4_100, countLabel: "subs", mrr: 3_500, trial: "3-Day Trial", trialNote: "Offline mixes" },
  { id: "s9", appId: "calorietrack", name: "CalorieTrack Pro Annual", productId: "com.octo.calorie.pro.annual", kind: "auto-renewable", price: 29.99, term: "yr", stores: ["apple"], status: "active", count: 2_300, countLabel: "subs", mrr: 5_700, trial: "7-Day Trial", trialNote: "Watch app unlock" },
  { id: "s10", appId: "budgetbuddy", name: "BudgetBuddy Plus Monthly", productId: "com.octo.budget.plus.monthly", kind: "auto-renewable", price: 4.99, term: "mo", stores: ["apple"], status: "active", count: 1_950, countLabel: "subs", mrr: 7_400, trial: "14-Day Trial", trialNote: "Bank sync included" },
  { id: "s11", appId: "habitocto", name: "Black Friday Annual Promo", productId: "com.octo.habits.promo.bf", kind: "promo", badge: "PROMO", price: 39.99, term: "yr", stores: ["apple", "google"], status: "review", count: 0, countLabel: "subs", mrr: 0, trial: "Intro Offer 20% Off", trialNote: "Starts Nov 24" },
  { id: "s12", appId: "lingualoop", name: "LinguaLoop Win-back Offer", productId: "com.octo.lingua.winback", kind: "promo", badge: "WIN-BACK", price: 2.99, term: "mo", stores: ["apple", "google"], status: "active", count: 380, countLabel: "subs", mrr: 1_100, trial: "3 Months at 50%", trialNote: "Lapsed users only" },
]

export type PaywallVariant = {
  id: string
  name: string
  description: string
  traffic: number | "trigger"
  conversion: number
  mrr: number
  placement: string
  winner?: number
  tone: "neutral" | "mint" | "lavender"
  mock: { headline: string; options: { label: string; price: string; highlight?: boolean }[]; ribbon?: string }
}

export const SEED_PAYWALLS: PaywallVariant[] = [
  {
    id: "pw-control", name: "Onboarding V4 (Control)", description: "Hero value matrix, Annual ($49.99) preselected vs Monthly ($9.99).",
    traffic: 50, conversion: 4.8, mrr: 48_200, placement: "First Open", tone: "neutral",
    mock: { headline: "Unlock Pro", options: [{ label: "Annual", price: "$4.16/mo", highlight: true }, { label: "Monthly", price: "$9.99/mo" }] },
  },
  {
    id: "pw-bf", name: "Black Friday Promo", description: "Annual $39.99 (20% intro discount) + 3-day risk-free trial countdown.",
    traffic: 30, conversion: 6.9, mrr: 38_400, placement: "Rollout candidate", winner: 43, tone: "mint",
    mock: { headline: "Holiday offer", ribbon: "20% OFF", options: [{ label: "1 Year Unlimited", price: "$39.99", highlight: true }] },
  },
  {
    id: "pw-winback", name: "Winback Cancel Flow V2", description: "Shown in Settings during the subscription-cancel confirmation.",
    traffic: "trigger", conversion: 18.2, mrr: 6_410, placement: "Churn Mitigation", tone: "lavender",
    mock: { headline: "Before you go", options: [{ label: "Keep 50% Off (3 Mo)", price: "$4.99/mo", highlight: true }] },
  },
]

export type StoreEventType = "DID_RENEW" | "PURCHASE" | "DID_FAIL_TO_RENEW" | "EXPIRED" | "REFUND" | "TEST_PING"

export type StoreEvent = { id: string; type: StoreEventType; label: string; at: number; simulated?: boolean }

export const EVENT_STYLE: Record<StoreEventType, { tag: string; className: string }> = {
  DID_RENEW: { tag: "RENEWAL", className: "bg-mint-hover text-mint" },
  PURCHASE: { tag: "PURCHASE", className: "bg-blue-hover text-tertiary" },
  DID_FAIL_TO_RENEW: { tag: "DID_FAIL", className: "bg-pink-hover text-pink" },
  EXPIRED: { tag: "EXPIRED", className: "bg-amber-hover text-amber" },
  REFUND: { tag: "REFUND", className: "bg-neutral-strong text-muted-foreground" },
  TEST_PING: { tag: "PING", className: "bg-lavender-hover text-lavender" },
}

export const SIMULATED_EVENTS: { value: Exclude<StoreEventType, "PURCHASE" | "TEST_PING">; label: string }[] = [
  { value: "DID_RENEW", label: "DID_RENEW (Instant)" },
  { value: "DID_FAIL_TO_RENEW", label: "DID_FAIL_TO_RENEW (Grace Period)" },
  { value: "EXPIRED", label: "EXPIRED (Immediate Revoke)" },
  { value: "REFUND", label: "REFUND (Revoke Entitlement)" },
]

export function seedEvents(now: number): StoreEvent[] {
  return [
    { id: "e1", type: "DID_RENEW", label: "HabitOcto Annual ($49.99)", at: now - 42_000 },
    { id: "e2", type: "PURCHASE", label: "HabitOcto Monthly ($9.99)", at: now - 2 * 60_000 },
    { id: "e3", type: "DID_FAIL_TO_RENEW", label: "Grace Period (16d left)", at: now - 8 * 60_000 },
    { id: "e4", type: "REFUND", label: "ZenReader Promo ($9.99)", at: now - 14 * 60_000 },
  ]
}

export function shortAgo(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.round(m / 60)}h ago`
}

export const RETENTION = [
  { label: "Month 1 (Immediate Post-Trial)", pct: 88.4, color: "bg-stream-mrr" },
  { label: "Month 3", pct: 74.2, color: "bg-mint" },
  { label: "Month 6 (Mid-Cycle)", pct: 65.0, color: "bg-stream-iap" },
  { label: "Month 12 (Year 2 Renewal)", pct: 58.1, color: "bg-tertiary" },
]

// ── Validation for the SKU editor ──────────────────────────────────────────

export const PRODUCT_ID_RE = /^[a-z][a-z0-9_-]*(\.[a-z0-9_-]+){2,}$/

export function money(n: number) {
  return `$${n.toFixed(2)}`
}

/** Monthly-equivalent price for amortized display. */
export function perMonth(p: Pick<Product, "price" | "term">) {
  if (p.term === "yr") return p.price / 12
  if (p.term === "wk") return (p.price * 52) / 12
  return p.price
}
