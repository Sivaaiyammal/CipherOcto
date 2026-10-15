// Portfolio apps — single source for the Dashboard, Apps page and App detail.
//
// Identity fields (name, package, status, owner, category…) come from the API.
// Anything the backend can't supply yet (revenue, installs, ratings, crash rate,
// version/build, rollouts) is `null` and renders as "—" — never a made-up number.
// Each of those becomes real as its backend module lands (releases, Play reporting).
import { SmartphoneIcon, type LucideIcon } from "lucide-react"

import type { BackendApp, BackendAppStatus } from "@/lib/billing-api"

export type Platform = "ios" | "android" | "watchos" | "macos" | "web"

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  watchos: "WatchOS",
  macos: "macOS",
  web: "Web App",
}

/**
 * Where the app is in its life. `live` / `review` / `staged` are the store-release
 * states the cards were designed around; the rest are the registry's own lifecycle
 * states. `staged` needs the releases module, so the API never produces it yet.
 */
export type ReleaseStatus =
  | { kind: "live" }
  | { kind: "review" }
  | { kind: "staged"; rollout: number }
  | { kind: "development" }
  | { kind: "maintenance" }
  | { kind: "archived" }

export type AppTone = "mint" | "blue" | "lavender" | "stone" | "pink" | "amber"

export type PortfolioApp = {
  id: string
  name: string
  /** Android package name (the design's "bundle id"). */
  bundleId: string
  /** Public URL segment: /<slug>/privacy */
  slug: string
  owner: string
  techStack: string
  playConsoleUrl: string
  createdAt: string
  /** The registry lifecycle state, as stored. */
  lifecycle: BackendAppStatus
  status: ReleaseStatus
  category: string
  platforms: Platform[]
  icon: LucideIcon
  tone: AppTone

  // ── Not available from the backend yet → null ("—" in the UI) ──
  version: string | null
  build: number | null
  installs30d: number | null
  revenueMonthly: number | null
  /** Month-over-month revenue change, percent */
  revenueGrowth: number | null
  /** Active entitlements, from the subscription backend (null until loaded / not permitted). */
  subscribers: number | null
  mau: number | null
  /** Crash-free sessions, percent */
  crashFree: number | null
  crashNote: string | null
  rating: number | null
  ratingCount: number | null
  integrations: string[]
  configFlags: number | null
  /** Finished a staged rollout recently; still shown in the rollout tracker */
  recentlyReleased?: boolean
}

const STATUS_MAP: Record<BackendAppStatus, ReleaseStatus> = {
  production: { kind: "live" },
  testing: { kind: "review" },
  development: { kind: "development" },
  maintenance: { kind: "maintenance" },
  archived: { kind: "archived" },
}

const TONES: AppTone[] = ["mint", "blue", "lavender", "stone", "pink", "amber"]

/** A stable tone per app, derived from its id so it never changes between loads. */
function toneFor(id: string): AppTone {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[h % TONES.length]!
}

/** Maps a registry app (+ optional live subscriber count) onto the card shape. */
export function toPortfolioApp(app: BackendApp, extra: { subscribers?: number | null } = {}): PortfolioApp {
  return {
    id: app.id,
    name: app.name,
    bundleId: app.packageName,
    slug: app.slug,
    owner: app.owner,
    techStack: app.techStack,
    playConsoleUrl: app.playConsoleUrl,
    createdAt: app.createdAt,
    lifecycle: app.status,
    status: STATUS_MAP[app.status],
    category: app.category,
    platforms: ["android"],
    icon: SmartphoneIcon,
    tone: toneFor(app.id),
    version: null,
    build: null,
    installs30d: null,
    revenueMonthly: null,
    revenueGrowth: null,
    subscribers: extra.subscribers ?? null,
    mau: null,
    crashFree: null,
    crashNote: null,
    rating: null,
    ratingCount: null,
    integrations: [],
    configFlags: null,
  }
}

export function releaseStatusLabel(status: ReleaseStatus) {
  switch (status.kind) {
    case "live":
      return "Live (Prod)"
    case "review":
      return "In Testing"
    case "staged":
      return `Staged Rollout (${status.rollout}%)`
    case "development":
      return "In Development"
    case "maintenance":
      return "Maintenance"
    case "archived":
      return "Archived"
  }
}

export const APP_TONE_TILE: Record<AppTone, string> = {
  mint: "bg-mint-hover text-mint",
  blue: "bg-blue-hover text-tertiary",
  lavender: "bg-lavender-hover text-lavender",
  stone: "bg-neutral-strong text-foreground",
  pink: "bg-pink-hover text-pink",
  amber: "bg-amber-surface text-amber",
}

/** Next step in a staged rollout: 10 → 25 → 50 → 100 */
export function nextRolloutStep(rollout: number) {
  return [10, 25, 50, 100].find((step) => step > rollout) ?? 100
}
