// Mock remote-config flags until the config service is connected.

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
