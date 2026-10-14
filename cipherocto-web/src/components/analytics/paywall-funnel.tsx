import * as React from "react"
import { LightbulbIcon, ListFilterIcon } from "lucide-react"

import { FUNNEL } from "@/data/analytics"
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PaywallFunnel({ factor }: { factor: number }) {
  const [dropoff, setDropoff] = React.useState(false)
  const steps = FUNNEL.map((s) => ({ ...s, count: s.count * factor }))

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Monetization &amp; Paywall Funnel</h2>
          <p className="text-xs text-muted-foreground">Stepwise conversion from installation to renewed subscriber.</p>
        </div>
        <button
          type="button"
          aria-pressed={dropoff}
          title="Show drop-off between steps"
          onClick={() => setDropoff((v) => !v)}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-xs font-bold",
            dropoff ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
          )}
        >
          <ListFilterIcon className="size-[18px]" />
          {dropoff && <span className="pr-1">Drop-off</span>}
        </button>
      </header>

      <ol className="space-y-3 pt-1">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].count : null
          const refCount = s.ref != null ? steps[s.ref].count : null
          const pct = refCount ? (s.count / refCount) * 100 : null
          const pctOfLaunch = (s.count / steps[0].count) * 100
          const drop = prev ? ((prev - s.count) / prev) * 100 : null
          const note =
            dropoff && drop != null
              ? `-${drop.toFixed(1)}% drop`
              : pct != null
                ? i === 1
                  ? `(${pctOfLaunch.toFixed(1)}%)`
                  : `(${pct.toFixed(1)}% ${s.refLabel})`
                : "(100%)"
          return (
            <li key={s.key} className={cn("space-y-1", s.highlight && "rounded-xl bg-mint-surface p-2")}>
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className={cn("flex min-w-0 items-center gap-2 font-semibold", s.highlight ? "font-bold text-mint" : "text-foreground")}>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                      s.highlight ? "bg-mint-border text-mint" : "bg-neutral-strong"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="shrink-0 text-right whitespace-nowrap">
                  <span className="font-bold text-foreground tabular-nums">{formatCompact(s.count).toUpperCase()}</span>
                  <span className={cn("ml-1 text-xs", s.highlight && !dropoff ? "font-bold text-mint" : "text-muted-foreground")}>{note}</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", s.highlight ? "bg-mint" : i > 3 ? "bg-mint/70" : "bg-primary")}
                  style={{ width: `${s.width}%`, opacity: s.highlight ? 1 : i === 0 ? 1 : i === 1 ? 0.8 : 0.6 }}
                />
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex items-start gap-2.5 rounded-xl bg-background p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-strong text-foreground">
          <LightbulbIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">Funnel Intelligence</p>
          <p className="text-xs text-muted-foreground">
            Highest conversion channel: <strong className="text-foreground">Organic Search</strong> (64.2% trial-to-paid), followed by{" "}
            <strong className="text-foreground">Referral AI Invites</strong> (59.8%).
          </p>
        </div>
      </div>
    </section>
  )
}
