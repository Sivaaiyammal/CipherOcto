import { ShieldCheckIcon } from "lucide-react"

import type { AppDetail } from "@/data/app-details"
import { APP_TONE_TILE, type PortfolioApp } from "@/data/apps"
import { cn } from "@/lib/utils"

const CAPABILITY_TONE = {
  blue: "bg-blue-surface text-tertiary",
  mint: "bg-mint-surface text-mint",
  amber: "bg-amber-surface text-amber",
  lavender: "bg-lavender-surface text-lavender",
}

export function AppHero({ app, detail }: { app: PortfolioApp; detail: AppDetail }) {
  const Icon = app.icon
  const androidShare = 100 - detail.iosShare
  const platformLine =
    detail.iosShare === 100
      ? "App Store"
      : detail.iosShare === 0
        ? "Play Store"
        : "App Store & Play Store"

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6 @4xl/main:flex-row @4xl/main:items-center">
      <span
        className={cn(
          "flex size-20 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-10",
          APP_TONE_TILE[app.tone]
        )}
      >
        <Icon />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">
            {app.name}
          </h1>
          <span className="rounded-full bg-neutral-strong px-2.5 py-0.5 text-xs font-semibold text-foreground/80 tabular-nums">
            Build #{app.build} ({app.status.kind === "live" ? "Production" : "Pre-release"})
          </span>
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-mint-hover px-2 py-0.5 text-[11px] font-bold text-mint tabular-nums">
          <ShieldCheckIcon className="size-3" />
          {app.crashFree.toFixed(2)}% Crash-free SLA
        </span>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
          <span className="font-mono text-xs">{app.bundleId}</span>
          <span aria-hidden="true">•</span>
          <span>
            App ID: <strong className="font-semibold text-foreground">{detail.appCode}</strong>
          </span>
        </p>
        <p className="text-[13px] text-muted-foreground">{detail.categoryLong}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {detail.capabilities.map((c) => (
            <li
              key={c.label}
              className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", CAPABILITY_TONE[c.tone])}
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <dl className="grid shrink-0 grid-cols-2 gap-4 rounded-xl bg-background p-4 text-xs @4xl/main:w-[26rem]">
        <div>
          <dt className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
            Live Sandbox Webhooks
          </dt>
          <dd className="mt-1.5 flex items-center gap-1.5 font-semibold text-mint">
            <span className="size-1.5 rounded-full bg-mint" />
            Connected ({detail.webhookLatency}s avg)
          </dd>
          <dd className="mt-0.5 text-muted-foreground">Last handshake: {detail.lastHandshake}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
            Primary Platform
          </dt>
          <dd className="mt-1.5 font-semibold text-foreground tabular-nums">
            {detail.iosShare > 0 && `iOS ${detail.iosShare}%`}
            {detail.iosShare > 0 && androidShare > 0 && " / "}
            {androidShare > 0 && `Android ${androidShare}%`}
          </dd>
          <dd className="mt-0.5 text-muted-foreground">{platformLine}</dd>
        </div>
      </dl>
    </section>
  )
}
