import * as React from "react"

import type { PortfolioApp } from "@/data/apps"

export type AppsStore = {
  apps: PortfolioApp[]
  getApp: (id: string | undefined) => PortfolioApp | undefined
  /** Advance a staged rollout one step (10 → 25 → 50 → 100 → live). */
  promote: (id: string) => void
}

export const AppsContext = React.createContext<AppsStore | null>(null)

export function useApps() {
  const store = React.useContext(AppsContext)
  if (!store) throw new Error("useApps must be used inside <AppsProvider>")
  return store
}
