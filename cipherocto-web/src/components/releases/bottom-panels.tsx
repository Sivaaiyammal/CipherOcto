import * as React from "react"
import { BellRingIcon, CircleCheckIcon, CreditCardIcon, HeartCrackIcon, HistoryIcon, ZapIcon } from "lucide-react"

import type { ReleaseEvent, TripRule } from "@/data/releases"
import { cn } from "@/lib/utils"

const RULE_ICON: Record<string, { icon: typeof ZapIcon; tone: string }> = {
  crash: { icon: HeartCrackIcon, tone: "bg-pink-hover text-pink" },
  iap: { icon: CreditCardIcon, tone: "bg-mint-border text-mint" },
  page: { icon: BellRingIcon, tone: "bg-neutral-strong text-foreground" },
}

export function TripwirePanel({ rules, onEdit }: { rules: TripRule[]; onEdit: () => void }) {
  const armed = rules.filter((r) => r.enabled).length
  const shown = rules.slice(0, 3)
  return (
    <section className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-1">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ZapIcon className="size-5 text-mint" />
            Automated Circuit Breaker &amp; Tripwires
          </h3>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", armed === rules.length ? "bg-mint-border text-mint" : "bg-amber-hover text-amber")}>
            {armed === rules.length ? `All ${rules.length} Armed` : `${armed} of ${rules.length} Armed`}
          </span>
        </header>
        <p className="text-[13px] text-muted-foreground">
          Zero-human-intervention triggers that freeze rollout progression immediately when anomalies breach safety bounds.
        </p>
      </div>

      <ul className="space-y-2">
        {shown.map((r) => {
          const meta = RULE_ICON[r.id] ?? RULE_ICON.page
          return (
            <li key={r.id} className={cn("flex items-start justify-between gap-3 rounded-xl bg-background p-4", !r.enabled && "opacity-60")}>
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                  <meta.icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.detail(r.value)}</p>
                </div>
              </div>
              <CircleCheckIcon className={cn("size-[18px] shrink-0", r.enabled ? "text-mint" : "text-muted-foreground")} aria-label={r.enabled ? "Armed" : "Disarmed"} />
            </li>
          )
        })}
      </ul>

      <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-mint" />
          Synchronized with Sentry, Bugsnag &amp; Google RTDN
        </span>
        <button type="button" onClick={onEdit} className="font-semibold text-foreground hover:underline">
          Edit Tripwire Rules
        </button>
      </p>
    </section>
  )
}

export function AuditPanel({ events, onExport }: { events: ReleaseEvent[]; onExport: () => void }) {
  const [all, setAll] = React.useState(false)
  const shown = all ? events : events.slice(0, 4)
  return (
    <section className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-1">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <HistoryIcon className="size-5" />
            Rollout Audit Trail &amp; Events
          </h3>
          <button type="button" onClick={onExport} className="text-[11px] font-bold text-muted-foreground hover:text-foreground">
            Export Audit CSV
          </button>
        </header>
        <p className="text-[13px] text-muted-foreground">
          Immutable log of manual approvals, CI Fastlane pushes, percentage step promotions, and safety halts.
        </p>
      </div>

      <ol aria-live="polite" className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-border">
        {shown.map((e) => (
          <li key={e.id} className="relative">
            <span className={cn("absolute top-1 -left-6 size-3 rounded-full ring-4 ring-card", e.tone)} />
            <p className="flex items-center justify-between gap-2 text-[13px]">
              <span className="font-semibold text-foreground">{e.title}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{e.when}</span>
            </p>
            <p className="text-[13px] text-muted-foreground">{e.body}</p>
          </li>
        ))}
      </ol>

      <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Displaying {shown.length} {all ? "" : "most recent "}cryptographically signed events
        </span>
        <button type="button" onClick={() => setAll((v) => !v)} className="font-semibold text-foreground hover:underline">
          {all ? "Show fewer" : `View All ${184 + events.length - 6} Audit Logs`}
        </button>
      </p>
    </section>
  )
}
