// Analytics & Product Intelligence — mock telemetry until the event pipeline is connected.

export type PlatformFilter = "all" | "ios" | "android"

/** Share of traffic by platform; used to re-base counts when a platform is picked. */
export const PLATFORM_SHARE: Record<PlatformFilter, number> = { all: 1, ios: 0.58, android: 0.42 }

export const BASE = {
  mau: 1_420_000,
  dau: 328_500,
  sessions: 12_800_000,
  liveUsers: 4_892,
  recovered: 42_390,
}

// ── Retention cohorts ──────────────────────────────────────────────────────

export const DAYS = [1, 7, 14, 21, 30, 60] as const
export type CohortValues = (number | null)[]

export type Cohort = {
  id: string
  label: string
  users: number
  release?: string
  all: CohortValues
}

export const MONTHLY_COHORTS: Cohort[] = [
  { id: "2024-10", label: "Oct 2024", users: 184_200, all: [84.2, 58.6, 46.8, 38.4, null, null] },
  { id: "2024-09", label: "Sep 2024", users: 162_400, release: "v2.9.0 release cohort", all: [82.8, 56.2, 44.1, 36.9, 31.2, null] },
  { id: "2024-08", label: "Aug 2024", users: 145_800, all: [78.5, 51.4, 38.2, 32.6, 28.9, 22.4] },
  { id: "2024-07", label: "Jul 2024", users: 138_100, all: [76.8, 49.8, 37.1, 31.0, 27.5, 21.8] },
  { id: "2024-06", label: "Jun 2024", users: 129_500, all: [75.2, 48.2, 36.0, 29.8, 26.4, 20.5] },
  { id: "2024-05", label: "May 2024", users: 118_000, all: [74.6, 47.5, 35.4, 29.1, 25.9, 19.8] },
]

// Weekly cohorts are the monthly curves with small, fixed offsets.
const WEEK_OFFSETS = [1.4, 0.6, -0.4, -1.1, -1.9, -2.6]
export const WEEKLY_COHORTS: Cohort[] = [
  ["2024-w43", "Wk of Oct 21", 46_800, 1],
  ["2024-w42", "Wk of Oct 14", 45_100, 2],
  ["2024-w41", "Wk of Oct 7", 46_300, 3],
  ["2024-w40", "Wk of Sep 30", 44_900, 4],
  ["2024-w39", "Wk of Sep 23", 41_700, 5],
  ["2024-w38", "Wk of Sep 16", 40_200, 6],
].map(([id, label, users, i]) => {
  const src = MONTHLY_COHORTS[Math.min(MONTHLY_COHORTS.length - 1, Math.floor(((i as number) - 1) / 1.5))]
  const off = WEEK_OFFSETS[(i as number) - 1]
  // older weeks have more elapsed days, so fewer cells are blank
  const elapsed = 7 * (i as number)
  return {
    id: id as string,
    label: label as string,
    users: users as number,
    all: src.all.map((v, d) => (v == null || DAYS[d] > elapsed ? null : Math.round((v + off) * 10) / 10)),
  }
})

export type CohortAudience = "all" | "subscribers"

/** Subscribers retain far better; fixed transform keeps the data stable. */
export function valuesFor(c: Cohort, audience: CohortAudience): CohortValues {
  if (audience === "all") return c.all
  // close ~45% of the gap to 100%, so curves keep their shape and never exceed it
  return c.all.map((v) => (v == null ? null : Math.round((v + (100 - v) * 0.45) * 10) / 10))
}

export function heatTone(v: number | null): "solid" | "high" | "mid" | "low" | "none" {
  if (v == null) return "none"
  if (v >= 70) return "solid"
  if (v >= 40) return "high"
  if (v >= 20) return "mid"
  return "low"
}

// ── Funnel ─────────────────────────────────────────────────────────────────

export type FunnelStep = {
  key: string
  label: string
  count: number
  /** secondary note builder: pct relative to a reference step */
  ref: number | null
  refLabel: string
  /** bar width in %, stylised as in the design (not strictly proportional) */
  width: number
  highlight?: boolean
}

export const FUNNEL: FunnelStep[] = [
  { key: "launch", label: "App Launch & Onboarding", count: 1_420_000, ref: null, refLabel: "", width: 100 },
  { key: "paywall", label: "Paywall View Impression", count: 770_000, ref: 0, refLabel: "", width: 54.2 },
  { key: "trial", label: "Free Trial Started", count: 143_000, ref: 1, refLabel: "of views", width: 28.5 },
  { key: "paid", label: "Trial Converted to Paid", count: 83_500, ref: 2, refLabel: "of trials", width: 58.4, highlight: true },
  { key: "renew", label: "1st Renewal Retention", count: 61_900, ref: 3, refLabel: "retained", width: 43.5 },
]

// ── Static deep-dive data ──────────────────────────────────────────────────

export const REGIONS = [
  { name: "United States", share: 42, dot: "bg-mint" },
  { name: "Germany", share: 14, dot: "bg-mint/80" },
  { name: "Japan", share: 12, dot: "bg-mint/60" },
  { name: "UK & Others", share: 32, dot: "bg-mint/40" },
]

export const SESSION_BUCKETS = [
  { label: "< 1 minute (Quick check-in)", pct: 18, bar: "bg-neutral-deep" },
  { label: "1 – 3 minutes (Habit completion)", pct: 28, bar: "bg-primary/50" },
  { label: "3 – 10 minutes (Deep workflow)", pct: 41, bar: "bg-mint" },
  { label: "> 10 minutes (Power session)", pct: 13, bar: "bg-primary" },
]

export const INITIAL_PULSE = [40, 55, 48, 70, 62, 80, 75, 90, 84, 65, 78, 88, 100, 92, 85]
