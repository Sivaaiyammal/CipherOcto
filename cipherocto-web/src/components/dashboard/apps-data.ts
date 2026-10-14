// Mock portfolio data until App Store Connect / Google Play sync is wired up.
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

export type Platform = "ios" | "android"

export type ReleaseStatus =
  | { kind: "live" }
  | { kind: "review" }
  | { kind: "staged"; rollout: number }

export type AppTone = "mint" | "blue" | "lavender" | "stone" | "pink" | "amber"

export type PortfolioApp = {
  id: string
  name: string
  version: string
  build: number
  category: string
  installs30d: number
  revenueMonthly: number
  subscribers: number
  status: ReleaseStatus
  platforms: Platform[]
  icon: LucideIcon
  tone: AppTone
}

export const APPS: PortfolioApp[] = [
  {
    id: "habitocto",
    name: "HabitOcto",
    version: "2.8.4",
    build: 142,
    category: "Productivity",
    installs30d: 582_000,
    revenueMonthly: 78_420,
    subscribers: 19_400,
    status: { kind: "live" },
    platforms: ["ios", "android"],
    icon: SmileIcon,
    tone: "mint",
  },
  {
    id: "focuspulse",
    name: "FocusPulse Pro",
    version: "1.4.1",
    build: 89,
    category: "Utilities",
    installs30d: 320_100,
    revenueMonthly: 52_180,
    subscribers: 12_150,
    status: { kind: "review" },
    platforms: ["ios", "android"],
    icon: TimerIcon,
    tone: "blue",
  },
  {
    id: "zenreader",
    name: "ZenReader AI",
    version: "3.0.0",
    build: 210,
    category: "Education",
    installs30d: 194_500,
    revenueMonthly: 29_800,
    subscribers: 7_200,
    status: { kind: "live" },
    platforms: ["ios", "android"],
    icon: BookOpenIcon,
    tone: "blue",
  },
  {
    id: "sleepocto",
    name: "SleepOcto Sounds",
    version: "1.1.2",
    build: 43,
    category: "Health & Fitness",
    installs30d: 148_200,
    revenueMonthly: 24_520,
    subscribers: 4_100,
    status: { kind: "staged", rollout: 25 },
    platforms: ["ios", "android"],
    icon: MoonIcon,
    tone: "stone",
  },
  {
    id: "calorietrack",
    name: "CalorieTrack",
    version: "2.0.3",
    build: 77,
    category: "Health & Fitness",
    installs30d: 96_400,
    revenueMonthly: 9_860,
    subscribers: 2_300,
    status: { kind: "live" },
    platforms: ["android"],
    icon: AppleIcon,
    tone: "pink",
  },
  {
    id: "budgetbuddy",
    name: "BudgetBuddy",
    version: "1.6.0",
    build: 58,
    category: "Finance",
    installs30d: 71_900,
    revenueMonthly: 7_420,
    subscribers: 1_950,
    status: { kind: "live" },
    platforms: ["ios"],
    icon: WalletIcon,
    tone: "amber",
  },
  {
    id: "lingualoop",
    name: "LinguaLoop",
    version: "0.9.8",
    build: 31,
    category: "Education",
    installs30d: 52_300,
    revenueMonthly: 4_910,
    subscribers: 1_120,
    status: { kind: "staged", rollout: 10 },
    platforms: ["ios", "android"],
    icon: LanguagesIcon,
    tone: "lavender",
  },
  {
    id: "pixelpal",
    name: "PixelPal Camera",
    version: "1.2.5",
    build: 64,
    category: "Photo & Video",
    installs30d: 44_800,
    revenueMonthly: 3_240,
    subscribers: 860,
    status: { kind: "review" },
    platforms: ["android"],
    icon: CameraIcon,
    tone: "pink",
  },
]

export type RemoteFlag = {
  key: string
  badge: { label: string; tone: "mint" | "stone" | "outline" }
  description: string
  enabled: boolean
}

export const QUICK_FLAGS: RemoteFlag[] = [
  {
    key: "enable_ai_summary",
    badge: { label: "90% Rollout", tone: "mint" },
    description: "HabitOcto & ZenReader AI",
    enabled: true,
  },
  {
    key: "black_friday_pricing",
    badge: { label: "Scheduled", tone: "stone" },
    description: "Global paywall pricing overhaul",
    enabled: false,
  },
  {
    key: "kill_switch_v1",
    badge: { label: "Safe", tone: "outline" },
    description: "Emergency bypass for legacy API clients",
    enabled: false,
  },
]

export const TOTAL_FLAGS = 24
