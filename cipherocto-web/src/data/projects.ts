// Projects & Tasks — sprint board mock data (no backend yet).

export type Status = "backlog" | "progress" | "review" | "done"
export type Priority = "P0" | "P1" | "P2" | "P3"
export type ProjectKey = "habitocto" | "focusocto" | "zenocto" | "core"

export const SPRINT = {
  name: "Sprint 24.4",
  range: "Oct 21 – Nov 3",
  /** days in the sprint grid; today is day index TODAY (Oct 30) */
  days: 14,
  today: 9,
  start: new Date(2024, 9, 21),
  baseClosed: 40,
  total: 50,
  daysLeft: 4,
}

export const PROJECTS: Record<ProjectKey, { label: string; chip: string; dot: string; bar: string }> = {
  habitocto: { label: "HabitOcto Pro", chip: "bg-mint-hover text-mint", dot: "bg-stream-mrr", bar: "bg-stream-mrr" },
  focusocto: { label: "FocusOcto", chip: "bg-lavender-hover text-lavender", dot: "bg-lavender", bar: "bg-lavender" },
  zenocto: { label: "ZenOcto", chip: "bg-blue-hover text-tertiary", dot: "bg-tertiary", bar: "bg-tertiary" },
  core: { label: "Platform Core", chip: "bg-neutral-strong text-foreground", dot: "bg-muted-foreground", bar: "bg-muted-foreground" },
}

export const STATUS_META: Record<Status, { label: string; dot: string; count: string }> = {
  backlog: { label: "Backlog / Triage", dot: "bg-neutral-deep", count: "bg-neutral-strong text-muted-foreground" },
  progress: { label: "In Progress", dot: "bg-stream-mrr motion-safe:animate-pulse", count: "bg-mint-border text-mint" },
  review: { label: "Review & QA", dot: "bg-amber", count: "bg-amber-hover text-amber" },
  done: { label: "Done & Shipped", dot: "bg-stream-mrr", count: "bg-mint-border text-mint" },
}

export const STATUS_ORDER: Status[] = ["backlog", "progress", "review", "done"]

export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  P0: { label: "P0 Blocker", className: "bg-pink-hover text-destructive motion-safe:animate-pulse" },
  P1: { label: "P1 High", className: "bg-amber-hover text-amber" },
  P2: { label: "P2 Med", className: "bg-blue-hover text-tertiary" },
  P3: { label: "P3 Low", className: "bg-neutral-strong text-muted-foreground" },
}

export const PEOPLE = [
  { id: "elena", name: "Elena Rostova", initials: "ER", tone: "bg-primary text-primary-foreground" },
  { id: "marcus", name: "Marcus Vance", initials: "MV", tone: "bg-lavender-hover text-lavender" },
  { id: "sophia", name: "Sophia Chen", initials: "SC", tone: "bg-pink-hover text-pink" },
  { id: "david", name: "David Kim", initials: "DK", tone: "bg-blue-hover text-tertiary" },
  { id: "priya", name: "Priya Patel", initials: "PP", tone: "bg-amber-hover text-amber" },
  { id: "lucas", name: "Lucas Wright", initials: "LW", tone: "bg-mint-hover text-mint" },
  { id: "chloe", name: "Chloe Bennett", initials: "CB", tone: "bg-neutral-strong text-foreground" },
] as const

export type PersonId = (typeof PEOPLE)[number]["id"]

export type Extra =
  | { kind: "warn"; text: string }
  | { kind: "flag"; flag: string; progress: number }
  | { kind: "chips"; chips: string[] }
  | { kind: "build"; text: string; verified: boolean }
  | { kind: "audit"; label: string; note: string }
  | { kind: "live"; text: string; note: string }

export type Task = {
  id: string
  title: string
  description: string
  project: ProjectKey
  /** shown instead of the project label when set (e.g. a cross-app task) */
  projectLabel?: string
  priority: Priority
  status: Status
  assignee: PersonId
  due: { label: string; urgent?: boolean }
  /** day indexes inside the sprint grid (0 = Oct 21); may run past the end */
  startDay: number
  endDay: number
  foot?: { kind: "check" | "chat" | "text"; value: string }
  extra?: Extra
  tag?: string
}

export const SEED_TASKS: Task[] = [
  { id: "t1", title: "StoreKit 2 Server-to-Server V2 Transition", description: "Migrate legacy App Store receipt validation webhooks to V2 notifications with real-time signature verification.", project: "focusocto", priority: "P2", status: "backlog", assignee: "marcus", due: { label: "Nov 12" }, startDay: 12, endDay: 22, foot: { kind: "check", value: "3/5" } },
  { id: "t2", title: "Localization: Japanese & German Store Listings", description: "Updated metadata, translated keywords, and localized high-converting hero preview assets for Q4 expansion.", project: "habitocto", priority: "P3", status: "backlog", assignee: "sophia", due: { label: "Nov 18" }, startDay: 14, endDay: 28, foot: { kind: "chat", value: "4" }, extra: { kind: "warn", text: "12 Screenshots Pending QA" } },
  { id: "t3", title: "Onboarding checklist copy experiment", description: "Three headline variants for the first-run checklist, wired to the paywall flag for measurement.", project: "habitocto", priority: "P3", status: "backlog", assignee: "elena", due: { label: "Nov 20" }, startDay: 16, endDay: 30, foot: { kind: "chat", value: "1" } },
  { id: "t4", title: "Widget gallery refresh", description: "Refresh home-screen widget previews for the new reading-streak design.", project: "zenocto", priority: "P3", status: "backlog", assignee: "priya", due: { label: "Nov 22" }, startDay: 18, endDay: 32, foot: { kind: "check", value: "0/4" } },
  { id: "t5", title: "Zero-app-release paywall dynamic config test", description: "Deploy Remote Config payload v4 testing annual pricing anchoring with 7-day trial trigger on onboard step 3.", project: "habitocto", priority: "P1", status: "progress", assignee: "elena", due: { label: "Tomorrow", urgent: true }, startDay: 3, endDay: 10, foot: { kind: "chat", value: "8" }, extra: { kind: "flag", flag: "flag_paywall_v4", progress: 75 } },
  { id: "t6", title: "CloudHSM Key Rotation & Zero-Trust Audit", description: "Periodic cryptographic key rollover for subscription token signing authority and OAuth2 endpoints.", project: "core", projectLabel: "Infra Core", priority: "P1", status: "progress", assignee: "david", due: { label: "Oct 31" }, startDay: 4, endDay: 10, foot: { kind: "check", value: "6/8" }, extra: { kind: "chips", chips: ["AWS FIPS-140-3", "2 specs"] } },
  { id: "t7", title: "Android 15 Predictive Back Gesture Polish", description: "Integrate OnBackPressedCallback animations for smooth seamless navigation drawer dismissals.", project: "zenocto", priority: "P2", status: "progress", assignee: "priya", due: { label: "Oct 30" }, startDay: 5, endDay: 9, foot: { kind: "text", value: "In PR Review" } },
  { id: "t8", title: "Offline sync conflict resolution", description: "Last-writer-wins with per-field merge for the focus-session log when two devices reconnect.", project: "focusocto", priority: "P2", status: "progress", assignee: "marcus", due: { label: "Nov 1" }, startDay: 7, endDay: 11, foot: { kind: "chat", value: "5" } },
  { id: "t9", title: "v2.9.1 Hotfix: Restore Purchases Edge Case", description: "Sandbox testing detected silent failure when user restores with family sharing disabled on iOS 18.0.1.", project: "habitocto", priority: "P0", status: "review", assignee: "lucas", due: { label: "Immediate", urgent: true }, startDay: 7, endDay: 9, foot: { kind: "text", value: "Lead QA Review" }, extra: { kind: "build", text: "Staging Build #144", verified: true } },
  { id: "t10", title: "Apple Privacy Nutrition Label Update", description: "Third-party SDK disclosure updates for Firebase Crashlytics & AppsFlyer required by App Store Connect.", project: "core", projectLabel: "All Apps", priority: "P1", status: "review", assignee: "elena", due: { label: "Today" }, startDay: 6, endDay: 9, foot: { kind: "chat", value: "2" }, extra: { kind: "audit", label: "Audit 4/4 Ready", note: "Sign-off pending" } },
  { id: "t11", title: "Paywall localization QA pass", description: "Verify translated paywall strings and price formatting across 12 storefronts before the flag goes wide.", project: "habitocto", priority: "P2", status: "review", assignee: "sophia", due: { label: "Nov 1" }, startDay: 8, endDay: 11, foot: { kind: "check", value: "9/12" } },
  { id: "t12", title: "Release v2.9.0 Day 1 Rollout (10% Active)", description: "Phased rollout enabled on Google Play and App Store. Telemetry health stable.", project: "habitocto", priority: "P2", status: "done", assignee: "chloe", due: { label: "Oct 27" }, startDay: 3, endDay: 6, foot: { kind: "text", value: "Completed Oct 27" }, tag: "Shipped", extra: { kind: "live", text: "Live in Prod", note: "Crash rate < 0.02%" } },
  { id: "t13", title: "Google Play RTDN PubSub Handshake Ping", description: "Resolved pubsub timeout acknowledgment queue latency issues with auto-scaling worker nodes.", project: "focusocto", priority: "P1", status: "done", assignee: "elena", due: { label: "Oct 25" }, startDay: 1, endDay: 4, foot: { kind: "text", value: "Elena Rostova" }, tag: "Closed" },
]

export type EpicStatus = "flight" | "stage" | "blocking"

export type Epic = {
  id: string
  title: string
  project: ProjectKey
  status: EpicStatus
  progress: number
  target: string
  owner: PersonId
  note: string
}

export const EPICS: Epic[] = [
  { id: "e1", title: "Paywall experimentation platform", project: "habitocto", status: "flight", progress: 75, target: "Nov 8", owner: "elena", note: "Remote-config payload v4 live for 10% of new installs." },
  { id: "e2", title: "StoreKit 2 migration", project: "focusocto", status: "flight", progress: 40, target: "Nov 15", owner: "marcus", note: "Server notifications V2 in staging; receipts still on V1." },
  { id: "e3", title: "Zero-trust key management", project: "core", status: "flight", progress: 70, target: "Nov 5", owner: "david", note: "CloudHSM rotation scheduled; audit evidence 6 of 8." },
  { id: "e4", title: "Android 15 compliance", project: "zenocto", status: "stage", progress: 90, target: "Oct 31", owner: "priya", note: "Predictive back in PR review; edge-to-edge verified." },
  { id: "e5", title: "Privacy & consent (GDPR)", project: "core", status: "stage", progress: 85, target: "Nov 1", owner: "elena", note: "Nutrition label audit ready, awaiting sign-off." },
  { id: "e6", title: "RTDN webhook reliability", project: "core", status: "blocking", progress: 45, target: "Oct 30", owner: "david", note: "P1: timeouts under burst load block v2.9.1." },
  { id: "e7", title: "macOS release pipeline", project: "zenocto", status: "blocking", progress: 30, target: "Nov 12", owner: "chloe", note: "Crash dump symbolication failing in CI." },
]

export const REVIEW_ITEMS = ["Privacy Manifest", "StoreKit 2", "GDPR Consent"] as const
