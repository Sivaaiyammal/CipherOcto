// Portfolio apps — single source for the Dashboard and the Apps page.
// Mock data until App Store Connect / Google Play sync is wired up.
import {
  AppleIcon,
  BookOpenIcon,
  CameraIcon,
  LanguagesIcon,
  MoonIcon,
  SmileIcon,
  TimerIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

export type Platform = "ios" | "android" | "watchos" | "macos" | "web"

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  watchos: "WatchOS",
  macos: "macOS",
  web: "Web App",
}

export type ReleaseStatus =
  | { kind: "live" }
  | { kind: "review" }
  | { kind: "staged"; rollout: number }

export type AppTone = "mint" | "blue" | "lavender" | "stone" | "pink" | "amber"

export type PortfolioApp = {
  id: string
  name: string
  bundleId: string
  version: string
  build: number
  category: string
  platforms: Platform[]
  status: ReleaseStatus
  icon: LucideIcon
  tone: AppTone
  installs30d: number
  revenueMonthly: number
  /** Month-over-month revenue change, percent */
  revenueGrowth: number
  subscribers: number
  mau: number
  /** Crash-free sessions, percent */
  crashFree: number
  crashNote: string
  rating: number
  ratingCount: number
  integrations: string[]
  configFlags: number
}

export const APP_QUOTA = 12

export const APPS: PortfolioApp[] = [
  {
    id: "habitocto",
    name: "HabitOcto",
    bundleId: "com.cipherocto.habitx.pro",
    version: "2.8.4",
    build: 142,
    category: "Productivity",
    platforms: ["ios", "android", "watchos"],
    status: { kind: "live" },
    icon: SmileIcon,
    tone: "mint",
    installs30d: 582_000,
    revenueMonthly: 78_420,
    revenueGrowth: 18.4,
    subscribers: 19_400,
    mau: 1_420_000,
    crashFree: 99.94,
    crashNote: "SLA Met",
    rating: 4.9,
    ratingCount: 84_200,
    integrations: ["StoreKit 2.0", "Play RTDN"],
    configFlags: 18,
  },
  {
    id: "focuspulse",
    name: "FocusPulse Pro",
    bundleId: "com.cipherocto.focus.team",
    version: "1.4.1",
    build: 89,
    category: "Utilities",
    platforms: ["ios", "macos", "web"],
    status: { kind: "review" },
    icon: TimerIcon,
    tone: "blue",
    installs30d: 320_100,
    revenueMonthly: 52_180,
    revenueGrowth: 12.1,
    subscribers: 12_150,
    mau: 980_000,
    crashFree: 99.88,
    crashNote: "Clean",
    rating: 4.8,
    ratingCount: 32_600,
    integrations: ["Stripe B2B", "Dynamic Paywalls"],
    configFlags: 9,
  },
  {
    id: "zenreader",
    name: "ZenReader AI",
    bundleId: "com.cipherocto.zen.ai",
    version: "3.0.0",
    build: 210,
    category: "Education",
    platforms: ["ios", "android"],
    status: { kind: "live" },
    icon: BookOpenIcon,
    tone: "blue",
    installs30d: 194_500,
    revenueMonthly: 29_800,
    revenueGrowth: 22.8,
    subscribers: 7_200,
    mau: 640_000,
    crashFree: 99.76,
    crashNote: "Healthy",
    rating: 4.7,
    ratingCount: 19_900,
    integrations: ["OpenAI Engine", "StoreKit 2"],
    configFlags: 12,
  },
  {
    id: "sleepocto",
    name: "SleepOcto Sounds",
    bundleId: "com.cipherocto.sleep.sounds",
    version: "1.1.2",
    build: 43,
    category: "Health & Fitness",
    platforms: ["android"],
    status: { kind: "staged", rollout: 25 },
    icon: MoonIcon,
    tone: "stone",
    installs30d: 148_200,
    revenueMonthly: 24_520,
    revenueGrowth: 8.4,
    subscribers: 4_100,
    mau: 510_000,
    crashFree: 99.91,
    crashNote: "Optimal",
    rating: 4.8,
    ratingCount: 41_300,
    integrations: ["Google Play Billing", "Audio DSP v3", "A/B Testing"],
    configFlags: 7,
  },
  {
    id: "calorietrack",
    name: "CalorieTrack",
    bundleId: "com.cipherocto.calorie.macro",
    version: "2.0.3",
    build: 77,
    category: "Health & Fitness",
    platforms: ["ios", "watchos"],
    status: { kind: "live" },
    icon: AppleIcon,
    tone: "pink",
    installs30d: 96_400,
    revenueMonthly: 9_860,
    revenueGrowth: 15.6,
    subscribers: 2_300,
    mau: 290_000,
    crashFree: 99.85,
    crashNote: "Nominal",
    rating: 4.8,
    ratingCount: 9_800,
    integrations: ["Vision ML", "StoreKit 2"],
    configFlags: 6,
  },
  {
    id: "budgetbuddy",
    name: "BudgetBuddy",
    bundleId: "com.cipherocto.budget.buddy",
    version: "1.6.0",
    build: 58,
    category: "Productivity",
    platforms: ["ios"],
    status: { kind: "live" },
    icon: WalletIcon,
    tone: "amber",
    installs30d: 71_900,
    revenueMonthly: 7_420,
    revenueGrowth: 6.2,
    subscribers: 1_950,
    mau: 210_000,
    crashFree: 99.71,
    crashNote: "Healthy",
    rating: 4.6,
    ratingCount: 5_400,
    integrations: ["Plaid Link", "StoreKit 2"],
    configFlags: 5,
  },
  {
    id: "lingualoop",
    name: "LinguaLoop",
    bundleId: "com.cipherocto.lingua.loop",
    version: "0.9.8",
    build: 31,
    category: "Productivity",
    platforms: ["ios", "android"],
    status: { kind: "staged", rollout: 10 },
    icon: LanguagesIcon,
    tone: "lavender",
    installs30d: 52_300,
    revenueMonthly: 4_910,
    revenueGrowth: 31.5,
    subscribers: 1_120,
    mau: 160_000,
    crashFree: 99.52,
    crashNote: "Watch",
    rating: 4.5,
    ratingCount: 3_100,
    integrations: ["Whisper STT", "Play Billing"],
    configFlags: 8,
  },
  {
    id: "pixelpal",
    name: "PixelPal Camera",
    bundleId: "com.cipherocto.pixelpal",
    version: "1.2.5",
    build: 64,
    category: "Utilities",
    platforms: ["android"],
    status: { kind: "review" },
    icon: CameraIcon,
    tone: "pink",
    installs30d: 44_800,
    revenueMonthly: 3_240,
    revenueGrowth: -2.4,
    subscribers: 860,
    mau: 120_000,
    crashFree: 99.38,
    crashNote: "Watch",
    rating: 4.4,
    ratingCount: 2_700,
    integrations: ["CameraX", "AdMob"],
    configFlags: 4,
  },
]

export function releaseStatusLabel(status: ReleaseStatus) {
  switch (status.kind) {
    case "live":
      return "Live (Prod)"
    case "review":
      return "Review Pending"
    case "staged":
      return `Staged Rollout (${status.rollout}%)`
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
