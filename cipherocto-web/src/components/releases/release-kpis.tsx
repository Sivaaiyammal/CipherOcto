import { CheckCheckIcon, GaugeIcon, RocketIcon, ShieldIcon, StampIcon, BadgeCheckIcon } from "lucide-react"

import type { Release, TripRule } from "@/data/releases"

export function ReleaseKpis({ releases, rules, rollbacks }: { releases: Release[]; rules: TripRule[]; rollbacks: number }) {
  const inFlight = releases.filter((r) => r.status === "rollout" || r.status === "canary" || r.status === "paused")
  const lead = inFlight[0]
  const second = inFlight[1]
  const review = releases.filter((r) => r.status === "review")
  const armed = rules.filter((r) => r.enabled).length

  return (
    <section aria-label="Release metrics" className="grid grid-cols-1 gap-5 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <article className="flex flex-col justify-between rounded-2xl bg-mint-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-mint uppercase">Active Rollouts</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">{inFlight.length} In Flight</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-mint-border text-mint">
            <RocketIcon className="size-5" />
          </span>
        </header>
        {lead ? (
          <div className="mt-4 space-y-2">
            <p className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-foreground">
                {lead.app} {lead.version}
              </span>
              <span className="shrink-0 font-semibold text-mint">{lead.status === "paused" ? "Paused" : `${lead.pct}%`}</span>
            </p>
            <div role="meter" aria-label="Lead rollout" aria-valuenow={lead.pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${lead.pct}%` }} />
            </div>
            <p className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground">
              <span className="flex items-center gap-1 text-mint">
                <BadgeCheckIcon className="size-3.5" />
                {second ? `${second.app} ${second.status === "canary" ? "Canary" : ""} ${second.pct}%` : "No second rollout"}
              </span>
              <span>Crash rate: 0.018%</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">Nothing is rolling out right now.</p>
        )}
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-blue-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-tertiary uppercase">Store Review Pipeline</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">
              {review.length} {review.length === 1 ? "Review" : "Reviews"}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-hover text-tertiary">
            <StampIcon className="size-5" />
          </span>
        </header>
        {review[0] ? (
          <div className="mt-4 space-y-2 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-foreground">
                {review[0].app} {review[0].version} ({review[0].build})
              </span>
              <span className="shrink-0 rounded-full bg-blue-hover px-2 py-0.5 text-tertiary">App Store</span>
            </p>
            <p className="truncate text-muted-foreground">Expedited review requested (avg 4.2h turnaround)</p>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-tertiary" />
              Pending StoreKit 2 paywall audit
            </span>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">No submissions waiting on the stores.</p>
        )}
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-neutral-strong p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-foreground uppercase">Canary &amp; Tripwires</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">99.98% Safe</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-card/70 text-foreground">
            <ShieldIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-2 text-xs">
          <p className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">Auto-Halt Circuit Breakers</span>
            <span className={armed === rules.length ? "font-semibold text-mint" : "font-semibold text-amber"}>
              {armed === rules.length ? "ARMED" : "PARTIAL"} ({armed}/{rules.length})
            </span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.1]">
            <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${(armed / rules.length) * 100}%` }} />
          </div>
          <p className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground">
            <span>
              {rollbacks} rollback{rollbacks === 1 ? "" : "s"} in 60d
            </span>
            <span className="text-mint">Zero False Positives</span>
          </p>
        </div>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-lavender-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-lavender uppercase">Target Adoption Pace</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">
              1.42M Users
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-lavender-hover text-lavender">
            <GaugeIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-2 text-xs">
          <p className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">SLA Rollout Velocity</span>
            <span className="font-semibold text-mint">+18% Ahead</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div className="h-full rounded-full bg-lavender" style={{ width: "78%" }} />
          </div>
          <p className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCheckIcon className="size-3.5" />
              Cumulative reach
            </span>
            <span className="text-foreground">iOS 64% / Android 36%</span>
          </p>
        </div>
      </article>
    </section>
  )
}
