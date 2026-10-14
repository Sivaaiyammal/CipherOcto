import * as React from "react"
import {
  PlayIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PortfolioApp } from "@/data/apps"
import { cn } from "@/lib/utils"

type IntegrationStatus = "connected" | "degraded" | "disconnected"

const STATUS_PILL: Record<IntegrationStatus, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-mint-border/70 text-mint" },
  degraded: { label: "Degraded", className: "bg-amber-surface text-amber" },
  disconnected: { label: "Disconnected", className: "bg-pink-hover text-pink" },
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
  // Mock connection state until the integrations API is wired up; app counts
  // come from the live portfolio.
  const appleApps = apps.filter((a) =>
    a.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  ).length
  const playApps = apps.filter((a) => a.platforms.includes("android")).length

  const integrations: Integration[] = [
    {
      id: "asc",
      name: "App Store Connect API",
      detail: `Key ID: #8K92F1A • ${pluralApps(appleApps)}`,
      status: "connected",
      icon: <SmartphoneIcon />,
      iconClass: "bg-card text-foreground",
    },
    {
      id: "play",
      name: "Google Play Console RTDN",
      detail: `Pub/Sub Stream Live • ${pluralApps(playApps)}`,
      status: "connected",
      icon: <PlayIcon />,
      iconClass: "bg-card text-mint",
    },
    {
      id: "stripe",
      name: "Stripe Custom Webhooks",
      detail: "USD, EUR, GBP Multi-currency",
      status: "connected",
      icon: <span className="text-sm font-bold">S</span>,
      iconClass: "bg-blue-hover text-tertiary",
    },
  ]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            Storefront Integration Status
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Real-time status of multi-tenant app store APIs and webhook listeners.
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-mint-surface text-mint">
          <ShieldCheckIcon className="size-4.5" />
        </span>
      </header>

      <ul className="flex flex-col gap-2.5">
        {integrations.map((item) => {
          const pill = STATUS_PILL[item.status]
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl bg-background p-3"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-[10px] shadow-[0_0_0_1px_var(--border)] [&_svg]:size-4.5",
                  item.iconClass
                )}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                <span
                  className={cn(
                    "mt-1.5 inline-flex h-5.5 items-center gap-1.5 rounded-full px-2 text-[11px] font-bold",
                    pill.className
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {pill.label}
                </span>
              </div>
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
        <span>Security audit verified yesterday at 18:40 UTC</span>
        <a href="#" className="font-semibold text-mint hover:underline">
          Manage Keys
        </a>
      </footer>
    </section>
  )
}
