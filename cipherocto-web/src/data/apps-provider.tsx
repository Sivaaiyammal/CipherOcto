import * as React from "react"

import { AppsContext, type AppsStore } from "@/data/apps-context"
import { APPS, nextRolloutStep, type PortfolioApp } from "@/data/apps"

// In-memory until the portfolio API exists; changes reset on reload.
export function AppsProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = React.useState<PortfolioApp[]>(APPS)

  const store = React.useMemo<AppsStore>(
    () => ({
      apps,
      getApp: (id) => apps.find((a) => a.id === id),
      addApp: (app) => setApps((prev) => [...prev, app]),
      promote: (id) =>
        setApps((prev) =>
          prev.map((a) => {
            if (a.id !== id || a.status.kind !== "staged") return a
            const next = nextRolloutStep(a.status.rollout)
            return next >= 100
              ? { ...a, status: { kind: "live" }, recentlyReleased: true }
              : { ...a, status: { kind: "staged", rollout: next } }
          })
        ),
    }),
    [apps]
  )

  return <AppsContext.Provider value={store}>{children}</AppsContext.Provider>
}
