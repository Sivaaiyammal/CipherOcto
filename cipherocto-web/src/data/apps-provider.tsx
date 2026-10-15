import * as React from "react"

import { AppsContext, type AppsStore } from "@/data/apps-context"
import { toPortfolioApp, type PortfolioApp } from "@/data/apps"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import { billingApi } from "@/lib/billing-api"

/** The portfolio, loaded from the API once the user is signed in. */
export function AppsProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus, can } = useAuth()
  const allowed = authStatus === "authenticated" && can("apps:read")
  const canSeeSubs = can("subscriptions:read")

  const [apps, setApps] = React.useState<PortfolioApp[]>([])
  const [status, setStatus] = React.useState<AppsStore["status"]>("idle")
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(
    async (signal?: AbortSignal) => {
      setStatus((s) => (s === "ready" ? s : "loading"))
      try {
        const list = await billingApi.listApps(signal)
        setApps(list.map((a) => toPortfolioApp(a)))
        setError(null)
        setStatus("ready")

        // Subscriber counts are real (active entitlements); fill them in as they arrive
        // so the list renders immediately. A failure just leaves "—".
        if (canSeeSubs) {
          const counts = await Promise.all(
            list.map((a) =>
              billingApi
                .summary(a.id, signal)
                .then((s) => [a.id, s.activeEntitlements] as const)
                .catch(() => [a.id, null] as const)
            )
          )
          if (signal?.aborted) return
          const bySub = new Map(counts)
          setApps((prev) => prev.map((a) => ({ ...a, subscribers: bySub.get(a.id) ?? a.subscribers })))
        }
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof ApiError ? err.message : "Couldn't load your apps.")
        setStatus("error")
      }
    },
    [canSeeSubs]
  )

  React.useEffect(() => {
    if (!allowed) {
      setApps([])
      setStatus("idle")
      return
    }
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [allowed, load])

  const store = React.useMemo<AppsStore>(
    () => ({
      apps,
      status,
      error,
      getApp: (id) => apps.find((a) => a.id === id),
      refresh: () => load(),
      upsert: (app) =>
        setApps((prev) =>
          prev.some((a) => a.id === app.id)
            ? prev.map((a) => (a.id === app.id ? { ...app, subscribers: a.subscribers } : a))
            : [...prev, app].sort((a, b) => a.name.localeCompare(b.name))
        ),
    }),
    [apps, status, error, load]
  )

  return <AppsContext.Provider value={store}>{children}</AppsContext.Provider>
}
