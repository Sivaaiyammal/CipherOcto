// Remote-config flags shown in the dashboard's quick panel.
// The config service isn't built yet, so there are no flags to list.

export type RemoteFlag = {
  key: string
  badge: { label: string; tone: "mint" | "stone" | "outline" }
  description: string
  enabled: boolean
}

export const QUICK_FLAGS: RemoteFlag[] = []

export const TOTAL_FLAGS = 0
