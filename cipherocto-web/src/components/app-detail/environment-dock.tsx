import * as React from "react"
import { Link } from "react-router-dom"

import type { PipelineBuild } from "@/data/app-insights"
import type { PortfolioApp } from "@/data/apps"
import { cn } from "@/lib/utils"

export function EnvironmentDock({
  app,
  candidate,
  buildHash,
  notificationsConfigured = null,
}: {
  app: PortfolioApp
  candidate: PipelineBuild | undefined
  buildHash: string | null
  /** Play RTDN status from the subscription backend; null while unknown. */
  notificationsConfigured?: boolean | null
}) {
  const apple = app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  const android = app.platforms.includes("android")

  const environments = [
    { id: "production", label: app.version ? `Production Live (v${app.version})` : "Production Live" },
    ...(apple && candidate
      ? [{ id: "testflight", label: `TestFlight Beta (v${candidate.version} #${candidate.build})` }]
      : []),
    ...(android ? [{ id: "internal", label: "Google Internal Testing" }] : []),
  ]
  const [env, setEnv] = React.useState(environments[0].id)

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-1)] @4xl/main:flex-row @4xl/main:items-center @4xl/main:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
          Environment Target:
        </span>
        <div role="radiogroup" aria-label="Environment" className="flex flex-wrap rounded-xl bg-foreground/[0.05] p-1">
          {environments.map((e) => (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={env === e.id}
              onClick={() => setEnv(e.id)}
              className={cn(
                "h-8 rounded-lg px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
                env === e.id
                  ? "bg-stream-mrr text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {apple && (
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-subtle-foreground" />
            StoreKit Server V2: <strong className="text-foreground">Not connected</strong>
          </li>
        )}
        {android && (
          <li className="flex items-center gap-1.5">
            <span
              className={cn("size-2 rounded-full", notificationsConfigured ? "bg-mint" : "bg-subtle-foreground")}
            />
            Google Play RTDN:{" "}
            <strong className="text-foreground">
              {notificationsConfigured === null ? "—" : notificationsConfigured ? "Configured" : "Not configured"}
            </strong>
          </li>
        )}
        <li>
          Privacy page:{" "}
          <Link to="/policies" className="font-mono font-semibold text-mint hover:underline">
            /{app.slug}/privacy
          </Link>
        </li>
        <li>
          Build Hash: <strong className="font-mono text-foreground">{buildHash ?? "—"}</strong>
        </li>
      </ul>
    </section>
  )
}
