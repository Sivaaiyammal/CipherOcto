// Revenue & Finance — mock ledger until App Store Connect / Play Console / Stripe
// payout reports are wired up. All amounts are USD; the page converts for display.

export type Currency = "USD" | "EUR" | "GBP"

export const CURRENCIES: Record<Currency, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: "$", rate: 1, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£)" },
}

export type MoneyFormat = (usd: number, mode?: "cents" | "whole" | "compact") => string

export function makeMoney(currency: Currency): MoneyFormat {
  const { symbol, rate } = CURRENCIES[currency]
  const cents = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
  const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
  const compactM = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 })
  return (usd, mode = "whole") => {
    const v = usd * rate
    const sign = v < 0 ? "-" : ""
    const abs = Math.abs(v)
    if (mode === "cents") return `${sign}${symbol}${cents.format(abs)}`
    if (mode === "compact") {
      const f = abs >= 1_000_000 ? compactM : compact
      return `${sign}${symbol}${f.format(abs).replace(/[KMB]$/, (s) => s.toLowerCase())}`
    }
    return `${sign}${symbol}${whole.format(abs)}`
  }
}

// ── Headline totals (30 days) ──────────────────────────────────────────────

export const TOTALS = {
  gross: 218_490.8,
  storeShare: 0.889, // share of gross processed through the App Store / Play
  fees: 32_480,
  refunds: 4_810,
  vat: 1_700,
  disputes: 380,
  /** refunds + VAT + disputes, exact ledger figure (parts are rounded) */
  refundsAndVat: 6_890.4,
  mrr: 142_300,
  netMrr: 14_820,
  newMrr: 18_400,
  churnMrr: 6_800,
  savedYtd: 14_200,
}

// ── Waterfall series ───────────────────────────────────────────────────────

export type Period = "monthly" | "quarterly" | "trailing"

export type WaterfallBar = {
  label: string
  gross: number
  cut: number
  refunds: number
  net: number
}

function bar(label: string, gross: number, cutRate: number, refundRate: number): WaterfallBar {
  const cut = Math.round(gross * cutRate)
  const refunds = Math.round(gross * refundRate * 100) / 100
  return { label, gross, cut, refunds, net: Math.round((gross - cut - refunds) * 100) / 100 }
}

export const WATERFALL: Record<Period, WaterfallBar[]> = {
  monthly: [
    bar("May", 150_200, 0.152, 0.032),
    bar("Jun", 163_400, 0.151, 0.0318),
    bar("Jul", 180_900, 0.15, 0.0316),
    bar("Aug", 187_600, 0.1495, 0.0314),
    bar("Sep", 198_700, 0.149, 0.0312),
    // October is the reconciled close — exact ledger figures.
    { label: "Oct 24", gross: 218_490.8, cut: 32_480, refunds: 6_890.4, net: 179_120.4 },
  ],
  quarterly: [
    bar("Q3 '23", 336_000, 0.155, 0.034),
    bar("Q4 '23", 372_400, 0.153, 0.0335),
    bar("Q1 '24", 407_700, 0.152, 0.033),
    bar("Q2 '24", 456_600, 0.151, 0.0322),
    bar("Q3 '24", 567_200, 0.1495, 0.0314),
    { label: "Q4 '24 QTD", gross: 218_490.8, cut: 32_480, refunds: 6_890.4, net: 179_120.4 },
  ],
  trailing: [
    bar("Nov", 118_000, 0.155, 0.0345),
    bar("Dec", 124_600, 0.154, 0.034),
    bar("Jan", 131_200, 0.153, 0.0335),
    bar("Feb", 136_400, 0.152, 0.033),
    bar("Mar", 140_100, 0.152, 0.0328),
    bar("Apr", 143_000, 0.151, 0.0325),
    bar("May", 150_200, 0.152, 0.032),
    bar("Jun", 163_400, 0.151, 0.0318),
    bar("Jul", 180_900, 0.15, 0.0316),
    bar("Aug", 187_600, 0.1495, 0.0314),
    bar("Sep", 198_700, 0.149, 0.0312),
    { label: "Oct", gross: 218_490.8, cut: 32_480, refunds: 6_890.4, net: 179_120.4 },
  ],
}

export const PERIOD_LABEL: Record<Period, string> = { monthly: "Monthly", quarterly: "Quarterly", trailing: "Trailing 12M" }

// ── Gateway payouts ────────────────────────────────────────────────────────

export type GatewayId = "apple" | "google" | "stripe"

export type Gateway = {
  id: GatewayId
  name: string
  route: string
  amount: number
  badge: string
  badgeTone: "mint" | "amber" | "blue"
  note: string
  /** settled payouts can be matched against the bank feed */
  settled: boolean
}

export const GATEWAYS: Gateway[] = [
  { id: "apple", name: "Apple App Store", route: "ACH to Chase Commercial", amount: 98_420, badge: "Cleared", badgeTone: "mint", note: "Cycle: Oct 31 Settled", settled: true },
  { id: "google", name: "Google Play Console", route: "Wire to Primary Treasury", amount: 43_180.2, badge: "Pending Nov 5", badgeTone: "amber", note: "Estimated: in 2 days", settled: false },
  { id: "stripe", name: "Stripe Web Billing", route: "Daily Rolling Direct Payout", amount: 22_520.2, badge: "Auto-Transfer", badgeTone: "blue", note: "Fees: 2.9% + 30¢", settled: true },
]

// ── Per-app unit economics ─────────────────────────────────────────────────

export type StoreFilter = "all" | "ios" | "android" | "web"

export type AppFinanceRow = {
  appId: string
  name: string
  sku: string
  platformsLabel: string
  stores: Exclude<StoreFilter, "all">[]
  tone: "blue" | "mint" | "lavender" | "amber" | "pink"
  gross: number
  fee: number
  refunds: number
  infra: number
  ltvCac: number
  status: "Settled" | "Pending"
}

export const APP_FINANCE: AppFinanceRow[] = [
  { appId: "habitocto", name: "HabitOcto Pro", sku: "com.cipherocto.habits", platformsLabel: "iOS & Web", stores: ["ios", "web"], tone: "blue", gross: 94_280, fee: 14_142, refunds: 1_840, infra: 2_120, ltvCac: 4.8, status: "Settled" },
  { appId: "focuspulse", name: "FocusPulse Team", sku: "com.cipherocto.focus", platformsLabel: "Multiplatform", stores: ["ios", "android", "web"], tone: "mint", gross: 52_640, fee: 7_896, refunds: 920, infra: 1_480, ltvCac: 5.2, status: "Settled" },
  { appId: "zenreader", name: "ZenReader AI", sku: "com.cipherocto.zen", platformsLabel: "iOS & Android", stores: ["ios", "android"], tone: "lavender", gross: 38_190, fee: 5_728.5, refunds: 1_240, infra: 4_890, ltvCac: 3.6, status: "Pending" },
  { appId: "sleepocto", name: "SleepOcto Sounds", sku: "com.cipherocto.sleep", platformsLabel: "Android Exclusive", stores: ["android"], tone: "amber", gross: 21_480, fee: 3_222, refunds: 480, infra: 360, ltvCac: 6.1, status: "Settled" },
  { appId: "calorietrack", name: "CalorieTrack Macro", sku: "com.cipherocto.calorie", platformsLabel: "iOS & WatchOS", stores: ["ios"], tone: "pink", gross: 11_900.8, fee: 1_491.5, refunds: 410.4, infra: 820, ltvCac: 4.1, status: "Settled" },
]

export function visibleRows(scope: string, store: StoreFilter, query: string) {
  const q = query.trim().toLowerCase()
  return APP_FINANCE.filter(
    (r) =>
      (scope === "all" || r.appId === scope) &&
      (store === "all" || r.stores.includes(store)) &&
      (!q || r.name.toLowerCase().includes(q) || r.sku.includes(q))
  )
}

export const net = (r: Pick<AppFinanceRow, "gross" | "fee" | "refunds" | "infra">) => r.gross - r.fee - r.refunds - r.infra

// ── Tax pack documents ─────────────────────────────────────────────────────

export const TAX_DOCS = [
  { id: "1099k", title: "Form 1099-K summary", detail: "Gross payment-card & third-party network transactions, tax year 2024", rows: [["Gross reportable (YTD)", 1_794_300], ["Transactions", 412_880]] },
  { id: "oss", title: "EU One-Stop-Shop VAT return", detail: "Q3 2024 · 27 member states · filed & paid", rows: [["VAT collected", 21_840], ["VAT remitted", 21_840]] },
  { id: "nexus", title: "US state nexus register", detail: "4 states registered · marketplace facilitators withhold at source", rows: [["Withheld at source", 18_420]] },
  { id: "fees", title: "Store commission statement", detail: "App Store & Play fees by tier · Small Business Program applied", rows: [["Commission (30D)", 32_480], ["Saved via 15% tier (YTD)", 14_200]] },
] as const
