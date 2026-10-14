// Mock revenue figures until the finance API is connected.
// Period labels are derived from today so they stay in step with the
// header's date range.

export type RevenuePeriod = "monthly" | "weekly" | "daily"

export type RevenueRow = {
  label: string
  title: string
  mrr: number
  iap: number
  ads: number
}

type Triple = [mrr: number, iap: number, ads: number]

const MONTHLY: Triple[] = [
  [118_400, 24_100, 9_800],
  [123_900, 25_600, 10_100],
  [129_500, 27_300, 10_400],
  [134_800, 28_900, 10_900],
  [138_600, 30_100, 11_000],
  [142_300, 31_420, 11_200],
]

const WEEKLY: Triple[] = [
  [31_200, 6_900, 2_450],
  [32_100, 7_050, 2_520],
  [32_600, 7_210, 2_580],
  [33_050, 7_330, 2_610],
  [33_400, 7_480, 2_640],
  [33_900, 7_560, 2_700],
]

const DAILY: Triple[] = [
  [4_620, 980, 350],
  [4_710, 1_020, 365],
  [4_680, 1_150, 372],
  [4_790, 1_090, 368],
  [4_850, 1_240, 390],
  [4_420, 1_380, 410],
  [4_910, 1_120, 381],
]

function toRow([mrr, iap, ads]: Triple, label: string, title: string): RevenueRow {
  return { label, title, mrr, iap, ads }
}

export function getRevenueData(period: RevenuePeriod, today = new Date()): RevenueRow[] {
  if (period === "monthly") {
    return MONTHLY.map((values, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (MONTHLY.length - 1 - i), 1)
      const isCurrent = i === MONTHLY.length - 1
      const short = d.toLocaleDateString("en-US", { month: "short" })
      return toRow(
        values,
        isCurrent ? `${short} (Current)` : short,
        d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      )
    })
  }

  if (period === "weekly") {
    return WEEKLY.map((values, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - today.getDay() - 7 * (WEEKLY.length - 1 - i))
      const isCurrent = i === WEEKLY.length - 1
      const short = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return toRow(values, isCurrent ? "This Week" : short, `Week of ${short}`)
    })
  }

  return DAILY.map((values, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (DAILY.length - 1 - i))
    const isCurrent = i === DAILY.length - 1
    return toRow(
      values,
      isCurrent ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    )
  })
}

export const REVENUE_BY_APP = [
  { app: "HabitOcto", value: 78_420, color: "var(--stream-mrr)" },
  { app: "FocusPulse Pro", value: 52_180, color: "var(--stream-iap)" },
  { app: "ZenReader AI", value: 29_800, color: "var(--stream-iap-soft)" },
  { app: "SleepOcto Sounds", value: 24_520, color: "var(--stream-ads-soft)" },
]

export const EXPENSE_SPLIT = [
  { label: "Cloud & AI LLM Infra", value: 18_200, color: "var(--stream-ads)" },
  { label: "Store Commission (Apple / Google)", value: 12_400, color: "var(--stream-mrr)" },
  { label: "Paid Growth & UA Campaigns", value: 7_800, color: "var(--stream-iap)" },
]

export { formatCompactUsd, usd } from "@/lib/format"
