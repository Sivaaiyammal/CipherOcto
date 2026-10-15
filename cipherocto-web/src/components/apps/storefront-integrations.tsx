import * as React from "react"
import { Link } from "react-router-dom"
import {
  PlayIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PortfolioApp } from "@/data/apps"
import { useAuth } from "@/data/auth-context"
import { billingApi, type SubscriptionSummary } from "@/lib/billing-api"
import { cn } from "@/lib/utils"

type IntegrationStatus = "connected" | "degraded" | "disconnected"

const STATUS_PILL: Record<IntegrationStatus, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-mint-border/70 text-mint" },
  degraded: { label: "Degraded", className: "bg-amber-surface text-amber" },
  disconnected: { label: "Not connected", className: "bg-pink-hover text-pink" },
}

type Integration = {
  id: string
  name: string
  detail: string
  status: IntegrationStatus
  icon: React.ReactNode
  iconClass: string
}

function pluralApps(n: number) {
  return `${n} App${n === 1 ? "" : "s"}`
}

export function StorefrontIntegrations({ apps }: { apps: PortfolioApp[] }) {
  // Connection state is real where the backend knows it: Google Play verification and
  // RTDN come from each app's subscription summary. App Store / Stripe aren't built yet.
  const { can } = useAuth()
  const canSeeSubs = can("subscriptions:read")
  const [summaries, setSummaries] = React.useState<SubscriptionSummary[] | null>(null)

  const enabled = canSeeSubs && apps.length > 0
  React.useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    Promise.all(apps.map((a) => billingApi.summary(a.id, ctrl.signal).catch(() => null))).then((all) => {
      if (!ctrl.signal.aborted) setSummaries(all.filter((s): s is SubscriptionSummary => s !== null))
    })
    return () => ctrl.abort()
  }, [apps, enabled])

  const known = enabled ? summaries : null
  const playVerified = known?.some((s) => s.verificationConfigured) ?? false
  const playNotified = known?.some((s) => s.notificationsConfigured) ?? false

  const appleApps = apps.filter((a) =>
    a.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  ).length
  const playApps = apps.filter((a) => a.platforms.includes("android")).length

  const integrations: Integration[] = [
    {
      id: "asc",
      name: "App Store Connect API",
      detail: `App Store support is planned • ${pluralApps(appleApps)}`,
      status: "disconnected",
      icon: <SmartphoneIcon />,
      iconClass: "text-foreground",
    },
    {
      id: "play",
      name: "Google Play Console RTDN",
      detail: `${
        !canSeeSubs
          ? "Status needs subscriptions access"
          : playNotified
            ? "Pub/Sub notifications on"
            : playVerified
              ? "Purchase verification on, notifications off"
              : "Add Play credentials in Billing Setup"
      } • ${pluralApps(playApps)}`,
      status: playVerified && playNotified ? "connected" : playVerified ? "degraded" : "disconnected",
      icon: <PlayIcon />,
      iconClass: "text-mint",
    },
    {
      id: "stripe",
      name: "Stripe Custom Webhooks",
      detail: "Not available yet",
      status: "disconnected",
      icon: <span className="text-sm font-bold">S</span>,
      iconClass: "text-lavender",
    },
  ]

  return (
    <section className="flex h-full flex-col justify-between gap-4 rounded-[18px] bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            Storefront Integration Status
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Real-time status of multi-tenant app store APIs and webhook listeners.
          </p>
        </div>
        <span title={playVerified && playNotified ? "Google Play connected" : "Some integrations are not connected"} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-mint">
          <ShieldCheckIcon className="size-4.5" />
        </span>
      </header>

      <ul className="flex flex-col gap-2.5">
        {integrations.map((item) => {
          const pill = STATUS_PILL[item.status]
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-background p-3"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] [&_svg]:size-4.5",
                  item.iconClass
                )}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span
                className={cn(
                  "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-bold",
                  pill.className
                )}
              >
                {pill.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg text-muted-foreground"
                aria-label={`Configure ${item.name}`}
              >
                <SlidersHorizontalIcon />
              </Button>
            </li>
          )
        })}
      </ul>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Google Play status comes from your apps' billing setup.</span>
        <Link to="/billing" className="font-bold text-mint hover:underline">
          Manage Keys
        </Link>
      </footer>
    </section>
  )
}
