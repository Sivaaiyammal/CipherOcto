import * as React from "react"
import { CreditCardIcon, UserMinusIcon } from "lucide-react"

import { BASE, INITIAL_PULSE, REGIONS, SESSION_BUCKETS } from "@/data/analytics"
import { cn } from "@/lib/utils"

const card = "flex min-w-0 flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]"

/** Rolling 15-sample histogram; the count follows the newest sample. */
export function LivePulse({ factor, appCount }: { factor: number; appCount: number }) {
  const [bars, setBars] = React.useState(INITIAL_PULSE)

  React.useEffect(() => {
    const t = window.setInterval(() => {
      setBars((prev) => {
        const last = prev[prev.length - 1]
        const next = Math.min(100, Math.max(35, last + (Math.random() - 0.5) * 26))
        return [...prev.slice(1), Math.round(next)]
      })
    }, 2500)
    return () => window.clearInterval(t)
  }, [])

  const live = Math.round(BASE.liveUsers * factor * (bars[bars.length - 1] / INITIAL_PULSE[INITIAL_PULSE.length - 1]))
  const peak = Math.round(124 * factor)

  return (
    <section className={card}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full rounded-full bg-mint opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2.5 rounded-full bg-mint" />
            </span>
            Live Users (RTDN Pulse)
          </h3>
          <span className="shrink-0 rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold text-mint">Real-time</span>
        </div>
        <div className="pt-3">
          <p aria-live="off" className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">
            {live.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-muted-foreground">Active right now across {appCount} live apps</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Past 30 minutes</span>
          <span>+{peak}/min peak</span>
        </div>
        <div className="flex h-16 items-end gap-1 px-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t transition-[height,background-color] duration-500 hover:bg-mint",
                i >= bars.length - 5 ? (i === bars.length - 1 ? "bg-mint" : "bg-mint-border") : "bg-neutral-strong"
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-2">
        <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
          <span>Top Active Regions</span>
          <span>Share</span>
        </div>
        <ul className="space-y-1.5 text-[13px]">
          {REGIONS.map((r) => (
            <li key={r.name} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className={cn("size-2 rounded-full", r.dot)} />
                {r.name}
              </span>
              <span className="font-semibold text-foreground tabular-nums">{r.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function SessionEngagement({ factor }: { factor: number }) {
  const sessions = (BASE.sessions * factor) / 1_000_000
  return (
    <section className={card}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">Session Engagement</h3>
          <span className="shrink-0 rounded-full bg-blue-hover px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-tertiary">30d Window</span>
        </div>
        <div className="flex items-start justify-between gap-3 pt-3">
          <div>
            <p className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">6m 42s</p>
            <p className="text-xs text-muted-foreground">Average session duration (+45s MoM)</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold text-foreground tabular-nums">{sessions.toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">Session Length Distribution</p>
        {SESSION_BUCKETS.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between pb-1 text-xs text-foreground">
              <span>{b.label}</span>
              <span className="font-semibold tabular-nums">{b.pct}%</span>
            </div>
            <div role="meter" aria-label={b.label} aria-valuenow={b.pct} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
              <div className={cn("h-full rounded-full", b.bar)} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-background p-3 text-xs text-foreground">
        <span>
          Stickiness ratio: <strong className="font-semibold">3.8 sessions / day</strong>
        </span>
        <span className="text-[11px] font-bold whitespace-nowrap text-mint">+11% vs Q3</span>
      </div>
    </section>
  )
}

export function ChurnDiagnostics({ factor }: { factor: number }) {
  return (
    <section className={card}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">Churn &amp; Diagnostics</h3>
          <span className="shrink-0 rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-mint">Low Risk</span>
        </div>
        <div className="flex items-start justify-between gap-3 pt-3">
          <div>
            <p className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">2.14%</p>
            <p className="text-xs text-muted-foreground">Monthly churn rate (-0.42% delta)</p>
          </div>
          <span className="shrink-0 rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-mint">Good Health</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">Voluntary vs Involuntary</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Billing Failure</span>
              <CreditCardIcon className="size-3.5" />
            </div>
            <p className="pt-1 text-lg font-bold text-foreground">38%</p>
            <p className="pt-0.5 text-xs font-semibold text-mint">68.4% Dunning Recov.</p>
          </div>
          <div className="rounded-xl bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Voluntary Exit</span>
              <UserMinusIcon className="size-3.5" />
            </div>
            <p className="pt-1 text-lg font-bold text-foreground">62%</p>
            <p className="pt-0.5 text-xs text-muted-foreground">App Store / Play</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 rounded-xl bg-mint-surface p-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-mint">Smart In-App Grace Period</span>
          <span className="font-bold text-mint tabular-nums">${Math.round(BASE.recovered * factor).toLocaleString("en-US")}</span>
        </div>
        <div role="meter" aria-label="Dunning recovery rate" aria-valuenow={68.4} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full rounded-full bg-mint" style={{ width: "68.4%" }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Dunning recovery rate</span>
          <span className="font-semibold text-mint">68.4% success</span>
        </div>
      </div>
    </section>
  )
}
