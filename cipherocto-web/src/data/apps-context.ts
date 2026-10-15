import * as React from "react"

import type { PortfolioApp } from "@/data/apps"

export type AppsStore = {
  apps: PortfolioApp[]
  /** "idle" until signed in (or when the role can't read apps). */
  status: "idle" | "loading" | "ready" | "error"
  error: string | null
  getApp: (id: string | undefined) => PortfolioApp | undefined
  /** Re-fetch the portfolio from the API. */
  refresh: () => Promise<void>
  /** Insert or replace an app the API just returned (after create / update). */
  upsert: (app: PortfolioApp) => void
}

export const AppsContext = React.createContext<AppsStore | null>(null)

export function useApps() {
  const store = React.useContext(AppsContext)
  if (!store) throw new Error("useApps must be used inside <AppsProvider>")
  return store
}
