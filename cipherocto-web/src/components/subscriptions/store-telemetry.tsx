import * as React from "react"
import { ChartSplineIcon, CreditCardIcon, CircleAlertIcon, LightbulbIcon, PlayIcon, RadioTowerIcon, SmartphoneIcon } from "lucide-react"

import { Link } from "react-router-dom"
import { EVENT_STYLE, RETENTION, shortAgo, type StoreEvent } from "@/data/subscriptions"
import { cn } from "@/lib/utils"

const GATEWAYS = [
  { name: "Apple StoreKit 2 V2", detail: "Zero lag • 99.99% valid JWS signatures", icon: SmartphoneIcon },
  { name: "Google Play RTDN Pub/Sub", detail: "Connected • Real-time stream active", icon: PlayIcon },
  { name: "Stripe Billing Webhook Engine", detail: "Signing secret verified • TLS 1.3", icon: CreditCardIcon },
]

export function StoreGateways({ events, onTestPing }: { events: StoreEvent[]; onTestPing: () => void }) {
  // Re-render every 15s so relative times stay fresh
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <RadioTowerIcon className="size-5 text-mint" />
          Store Gateways &amp; RTDN
        </h3>
        <button type="button" onClick={onTestPing} className="shrink-0 rounded bg-foreground/[0.04] px-2.5 py-1 text-[11px] whitespace-nowrap font-bold tracking-[0.04em] text-foreground hover:bg-foreground/[0.08]">
          Test Ping
        </button>
      </header>
      <ul className="space-y-2">
        {GATEWAYS.map(({ name, detail, icon: Icon }) => (
          <li key={name} className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="size-4 shrink-0 text-foreground" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{detail}</p>
              </div>
            </div>
            <span className="size-2.5 shrink-0 rounded-full bg-stream-mrr" aria-label="Healthy" />
          </li>
        ))}
      </ul>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
          <span>Recent Store Webhook Events</span>
          <span className="flex items-center gap-1 font-mono text-mint lowercase">
            <span className="size-1.5 rounded-full bg-stream-mrr motion-safe:animate-pulse" />
            live
          </span>
        </div>
        <ol aria-live="polite" className="space-y-1.5 font-mono text-xs">
          {events.slice(0, 6).map((e) => {
            const style = EVENT_STYLE[e.type]
            return (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded bg-background p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold", style.className)}>{style.tag}</span>
                  <span className="truncate text-foreground">{e.label}</span>
                  {e.simulated && <span className="shrink-0 rounded bg-neutral-strong px-1 text-[9px] font-bold text-muted-foreground uppercase">sim</span>}
                </div>
                <span className="ml-2 shrink-0 whitespace-nowrap text-muted-foreground">{shortAgo(e.at, now)}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export function CohortRetention() {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Cohort Retention Curve</h3>
          <p className="text-xs text-muted-foreground">Subscribers retained through Month 12</p>
        </div>
        <ChartSplineIcon className="size-5 text-muted-foreground" />
      </header>
      <div className="space-y-3 pt-1">
        {RETENTION.map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold tracking-[0.02em]">
              <span className="text-foreground">{r.label}</span>
              <span className="text-foreground tabular-nums">{r.pct.toFixed(1)}%</span>
            </div>
            <div role="meter" aria-label={r.label} aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100} className="h-2.5 w-full overflow-hidden rounded-full bg-background">
              <div className={cn("h-full rounded-full transition-[width] duration-500", r.color)} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-mint-surface p-2.5 text-mint">
        <LightbulbIcon className="mt-0.5 size-[18px] shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong>Key Growth Insight:</strong> Annual subscribers show <strong>+42% higher 12-month retention</strong> than monthly. Consider
          pre-selecting annual plans on every paywall.
        </p>
      </div>
    </section>
  )
}

export function SmartDunning() {
  return (
    <section className="flex flex-col gap-2 rounded-xl bg-pink-surface p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <CircleAlertIcon className="size-5 text-destructive" />
          Smart Dunning &amp; Recovery
        </h3>
        <span className="shrink-0 rounded-full bg-pink-hover px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-pink">68.4% SAVED</span>
      </header>
      <p className="text-[13px] text-muted-foreground">
        Automated payment retries coordinated with Apple and Google billing-retry and card-refresh notifications.
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex flex-col rounded-lg bg-card p-2.5">
          <span className="text-xs text-muted-foreground">Recovered This Month</span>
          <span className="text-lg font-bold text-foreground tabular-nums">$4,810</span>
        </div>
        <div className="flex flex-col rounded-lg bg-card p-2.5">
          <span className="text-xs text-muted-foreground">Scheduled Retries</span>
          <span className="text-lg font-bold text-foreground tabular-nums">84 cards</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <span>Billing grace window: 16 days</span>
        <Link to="/settings" className="font-semibold text-mint hover:underline">
          Manage Rules →
        </Link>
      </div>
    </section>
  )
}
