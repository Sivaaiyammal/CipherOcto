// Release Management — mock pipeline until App Store Connect / Play Console sync is wired up.

export type ReleaseStatus = "rollout" | "paused" | "halted" | "canary" | "review" | "draft" | "shipped"
export type Category = "rollout" | "review" | "draft" | "shipped"
export type Tone = "mint" | "lavender" | "blue" | "neutral" | "amber" | "pink"

export type Release = {
  id: string
  app: string
  initials: string
  tone: Tone
  version: string
  build: number
  commit: string
  /** platform label shown in the table, e.g. "App Store Phased" */
  track: string
  platform: "ios" | "android" | "sdk"
  status: ReleaseStatus
  /** rollout percentage, 0-100 */
  pct: number
  /** devices addressable by this release */
  audience: number
  crash: string
  note: string
  highlights: string[]
}

export const STAGES = [
  { pct: 1, label: "Day 1" },
  { pct: 20, label: "Day 2" },
  { pct: 50, label: "Day 3" },
  { pct: 75, label: "Day 4" },
  { pct: 90, label: "Day 5" },
  { pct: 100, label: "Full Prod" },
] as const

export const SPOTLIGHT_ID = "r1"
export const FALLBACK = "HabitOcto Pro v2.8.4 (Verified Stable SLA: 99.98%)"

export const SEED_RELEASES: Release[] = [
  { id: "r1", app: "HabitOcto Pro", initials: "HP", tone: "mint", version: "v2.9.0", build: 148, commit: "f8a19d", track: "App Store Phased", platform: "ios", status: "rollout", pct: 20, audience: 921_000, crash: "0.018% Crash Free", note: "StoreKit 2: 100% Nominal", highlights: ["Paywall v4", "SK2 Migration"] },
  { id: "r2", app: "FocusOcto", initials: "FO", tone: "lavender", version: "v1.4.2", build: 82, commit: "c04e21", track: "Play Staged Rollout", platform: "android", status: "canary", pct: 5, audience: 856_000, crash: "0.009% Crash Free", note: "ANR: 0.00% Zero Freeze", highlights: ["Predictive Back", "WidgetKit Fix"] },
  { id: "r3", app: "ZenOcto", initials: "ZO", tone: "blue", version: "v3.1.0", build: 89, commit: "90e1bc", track: "App Store Connect", platform: "ios", status: "review", pct: 0, audience: 540_000, crash: "Pre-flight Passed", note: "Privacy Manifest: Validated", highlights: ["Binaural Audio", "Sleep Tracking"] },
  { id: "r4", app: "CoreSDK Telemetry", initials: "CS", tone: "neutral", version: "v4.2.0-rc2", build: 12, commit: "d3e120", track: "Internal Maven / CocoaPods", platform: "sdk", status: "draft", pct: 0, audience: 0, crash: "Unit Tests 100%", note: "Memory Footprint: -1.2MB", highlights: ["Rust Core Bridge", "HTTP/3 QUIC"] },
  { id: "r5", app: "HabitOcto Pro", initials: "HP", tone: "neutral", version: "v2.8.4", build: 142, commit: "8731ad", track: "App Store Production", platform: "ios", status: "shipped", pct: 100, audience: 1_180_000, crash: "99.98% Crash Free", note: "Archived Rollout", highlights: ["Halloween Theme", "Bugfix Audio"] },
  { id: "r6", app: "SleepOcto", initials: "SO", tone: "amber", version: "v2.2.0", build: 61, commit: "5a1e7c", track: "Play Console", platform: "android", status: "draft", pct: 0, audience: 410_000, crash: "Unit Tests 98%", note: "Awaiting QA sign-off", highlights: ["Soundpack Streaming"] },
  { id: "r7", app: "CalorieTrack", initials: "CT", tone: "pink", version: "v1.9.3", build: 47, commit: "19b0ce", track: "App Store Production", platform: "ios", status: "shipped", pct: 100, audience: 310_000, crash: "99.96% Crash Free", note: "Archived Rollout", highlights: ["Macro Rings", "Watch Complication"] },
  { id: "r8", app: "BudgetBuddy", initials: "BB", tone: "blue", version: "v1.2.0", build: 33, commit: "a77e02", track: "App Store Connect", platform: "ios", status: "draft", pct: 0, audience: 190_000, crash: "Unit Tests 100%", note: "Bank sync beta flag off", highlights: ["Bank Sync", "CSV Export"] },
  { id: "r9", app: "FocusOcto", initials: "FO", tone: "neutral", version: "v1.4.1", build: 79, commit: "2fd9a4", track: "Play Production", platform: "android", status: "shipped", pct: 100, audience: 842_000, crash: "99.97% Crash Free", note: "Archived Rollout", highlights: ["Focus Sessions v2"] },
  { id: "r10", app: "ZenOcto", initials: "ZO", tone: "neutral", version: "v3.0.2", build: 85, commit: "6c0b17", track: "App Store Production", platform: "ios", status: "shipped", pct: 100, audience: 531_000, crash: "99.99% Crash Free", note: "Archived Rollout", highlights: ["Hotfix: Timer drift"] },
  { id: "r11", app: "LinguaLoop", initials: "LL", tone: "lavender", version: "v2.0.0", build: 22, commit: "e19c33", track: "App Store Connect", platform: "ios", status: "draft", pct: 0, audience: 120_000, crash: "Unit Tests 100%", note: "Localisation QA pending", highlights: ["Conversation Mode"] },
]

export const categoryOf = (s: ReleaseStatus): Category =>
  s === "rollout" || s === "paused" || s === "halted" || s === "canary" ? "rollout" : s

export type TripRule = { id: string; title: string; unit?: string; value?: number; step?: number; detail: (v?: number) => string; enabled: boolean }

export const SEED_RULES: TripRule[] = [
  { id: "crash", title: "Crash Regression Tripwire", unit: "%", value: 0.15, step: 0.01, detail: (v) => `Auto-halt rollout if Crash Rate exceeds > ${v}% over rolling 30-min window.`, enabled: true },
  { id: "iap", title: "StoreKit Purchase Failure Guard", unit: "%", value: 0.05, step: 0.01, detail: (v) => `Auto-pause if IAP signature validation fails for > ${v}% of checkout sessions.`, enabled: true },
  { id: "page", title: "Instant Escalation Dispatch", detail: () => "Broadcast high-severity alerts to Slack #prod-rollouts & PagerDuty.", enabled: true },
  { id: "anr", title: "ANR / Freeze Guard", unit: "%", value: 0.47, step: 0.01, detail: (v) => `Pause Android rollouts if ANR rate exceeds > ${v}% (Play Vitals bad-behaviour threshold).`, enabled: true },
  { id: "mem", title: "Memory Regression Tripwire", unit: "%", value: 8, step: 1, detail: (v) => `Halt if OOM terminations rise by > ${v}% versus the previous build.`, enabled: true },
  { id: "reject", title: "Store Rejection Notifier", detail: () => "Notify release managers the moment a submission is rejected or flagged in review.", enabled: true },
]

export type ReleaseEvent = { id: string; title: string; body: string; when: string; tone: string; ts: number }

export const SEED_EVENTS: ReleaseEvent[] = [
  { id: "e1", title: "Promoted HabitOcto Pro to 20%", body: "Promoted from 1% to 20% by Elena Rostova (Verified via Hardware 2FA).", when: "14m ago", tone: "bg-mint", ts: 4 },
  { id: "e2", title: "Fastlane Build Ingestion #89", body: "ZenOcto v3.1.0 build 89 uploaded to App Store Connect via GitHub Actions CI bot.", when: "2h 10m ago", tone: "bg-tertiary", ts: 3 },
  { id: "e3", title: "Rollout Completed: v2.8.4", body: "HabitOcto Pro v2.8.4 phased rollout safely reached 100% full release across all geo-targets.", when: "Yesterday at 18:30", tone: "bg-neutral-deep", ts: 2 },
  { id: "e4", title: "Canary TestFlight Triggered", body: "Dispatched to 2,500 internal enterprise beta testers with automated metric gathering.", when: "Oct 27, 11:15", tone: "bg-mint-border", ts: 1 },
  { id: "e5", title: "Privacy manifest validated", body: "ZenOcto v3.1.0 passed App Store pre-flight privacy checks.", when: "Oct 26, 16:40", tone: "bg-mint-border", ts: 0 },
  { id: "e6", title: "Tripwire thresholds reviewed", body: "Crash regression threshold confirmed at 0.15% by Priya Patel.", when: "Oct 25, 09:05", tone: "bg-neutral-deep", ts: -1 },
]

export const LOG_LINES = (r: Release) => [
  `[ci] build ${r.build} (${r.commit}) uploaded — ${r.app} ${r.version}`,
  `[sign] provisioning profile verified · bitcode stripped`,
  `[store] ${r.track}: metadata validated`,
  r.status === "draft" ? `[qa] waiting for sign-off` : `[store] phased release plan attached (${r.pct}% live)`,
  `[health] ${r.crash} · ${r.note}`,
  `[audit] last event recorded by Elena Rostova`,
]

export const initial = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
