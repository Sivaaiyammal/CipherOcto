// Revenue series for the dashboard charts.
//
// Revenue is imported from Google Play (finance module, not built yet), so every
// value is 0 and `hasRevenueData` reports false — the charts keep their axes and
// period labels but show an empty hint instead of invented bars.
// Period labels are derived from today so they stay in step with the header's date range.

export type RevenuePeriod = "monthly" | "weekly" | "daily"

export type RevenueRow = {
  label: string
  title: string
  mrr: number
  iap: number
  ads: number
}

const POINTS: Record<RevenuePeriod, number> = { monthly: 6, weekly: 6, daily: 7 }

function toRow(label: string, title: string): RevenueRow {
  return { label, title, mrr: 0, iap: 0, ads: 0 }
}

export function getRevenueData(period: RevenuePeriod, today = new Date()): RevenueRow[] {
  const n = POINTS[period]

  if (period === "monthly") {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (n - 1 - i), 1)
      const short = d.toLocaleDateString("en-US", { month: "short" })
      return toRow(
        i === n - 1 ? `${short} (Current)` : short,
        d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      )
    })
  }

  if (period === "weekly") {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - today.getDay() - 7 * (n - 1 - i))
      const short = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return toRow(i === n - 1 ? "This Week" : short, `Week of ${short}`)
    })
  }

  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (n - 1 - i))
    return toRow(
      i === n - 1 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    )
  })
}

export const hasRevenueData = (rows: RevenueRow[]) => rows.some((r) => r.mrr > 0 || r.iap > 0 || r.ads > 0)

/** Slice colours for per-app / per-category breakdowns, cycled in order. */
export const STREAM_COLORS = [
  "var(--stream-mrr)",
  "var(--stream-iap)",
  "var(--stream-iap-soft)",
  "var(--stream-ads-soft)",
  "var(--stream-ads)",
]

export type RevenueByAppItem = { app: string; value: number; color: string }
export type ExpenseItem = { label: string; value: number; color: string }

/**
 * Per-app revenue. Needs the finance import; until then no app has a revenue figure,
 * so this is empty (apps appear here automatically once `revenueMonthly` is non-null).
 */
export function revenueByApp(apps: { name: string; revenueMonthly: number | null }[]): RevenueByAppItem[] {
  return apps
    .filter((a): a is { name: string; revenueMonthly: number } => (a.revenueMonthly ?? 0) > 0)
    .sort((a, b) => b.revenueMonthly - a.revenueMonthly)
    .map((a, i) => ({ app: a.name, value: a.revenueMonthly, color: STREAM_COLORS[i % STREAM_COLORS.length]! }))
}

/** Expense categories come from the finance module (not built yet). */
export const EXPENSE_SPLIT: ExpenseItem[] = []

export { formatCompactUsd, usd } from "@/lib/format"
