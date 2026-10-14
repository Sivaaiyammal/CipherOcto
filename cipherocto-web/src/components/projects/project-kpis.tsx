import { BugIcon, CircleCheckIcon, ClipboardCheckIcon, ClockIcon, RocketIcon, ShieldIcon, TriangleAlertIcon, ZapIcon } from "lucide-react"

import { EPICS, REVIEW_ITEMS, SPRINT } from "@/data/projects"
import { cn } from "@/lib/utils"

export function ProjectKpis({
  closed,
  signedOff,
  onToggleSignOff,
}: {
  closed: number
  signedOff: Set<string>
  onToggleSignOff: (item: string) => void
}) {
  const pct = Math.round((closed / SPRINT.total) * 100)
  const blocking = EPICS.filter((e) => e.status === "blocking").length
  const flight = EPICS.filter((e) => e.status === "flight").length
  const stage = EPICS.filter((e) => e.status === "stage").length
  const pending = REVIEW_ITEMS.filter((i) => !signedOff.has(i))

  return (
    <section aria-label="Sprint metrics" className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <article className="flex flex-col justify-between rounded-2xl bg-mint-surface p-5 shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-mint">{SPRINT.name} Velocity</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-mint-border text-mint">
            <ZapIcon className="size-4" />
          </span>
        </header>
        <div className="my-3">
          <p className="flex items-baseline gap-2">
            <span className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">{pct}%</span>
            <span className="text-[11px] font-bold tracking-[0.04em] text-mint">
              {closed} / {SPRINT.total} tasks
            </span>
          </p>
          <div role="meter" aria-label="Sprint completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mint-border">
            <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p className="flex items-center justify-between text-xs text-mint">
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3.5" /> {SPRINT.daysLeft} days remaining
          </span>
          <span className="font-bold">+11.4% vs S24.3</span>
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-blue-surface p-5 shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-tertiary">Active Epics</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-hover text-tertiary">
            <RocketIcon className="size-4" />
          </span>
        </header>
        <div className="my-3">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">{EPICS.length} Epics</span>
            <span className="rounded-full bg-blue-hover px-2 py-0.5 text-[11px] font-bold text-tertiary">iOS &amp; Android</span>
          </p>
          <p className="mt-1.5 text-xs text-tertiary">
            {flight} in flight, {stage} in stage validation, {blocking} blocking
          </p>
        </div>
        <p className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-destructive">
            <TriangleAlertIcon className="size-3.5" /> {blocking} blocking releases
          </span>
          <span className="font-bold text-tertiary">88% target met</span>
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-amber-surface p-5 shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-amber">Store Review Readiness</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-amber-hover text-amber">
            <ClipboardCheckIcon className="size-4" />
          </span>
        </header>
        <div className="my-3">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">
              {pending.length ? `${pending.length} Pending` : "All clear"}
            </span>
            <span className="text-[11px] font-bold tracking-[0.04em] text-amber">{pending.length ? "Sign-offs required" : "Ready to submit"}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REVIEW_ITEMS.map((i) => {
              const done = signedOff.has(i)
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={done}
                  title={done ? "Signed off — click to undo" : "Click to sign off"}
                  onClick={() => onToggleSignOff(i)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors",
                    done ? "bg-mint-border text-mint line-through" : "bg-amber-hover text-amber hover:bg-amber-border"
                  )}
                >
                  {done && <CircleCheckIcon className="size-3" />}
                  {i}
                </button>
              )
            })}
          </div>
        </div>
        <p className="flex items-center justify-between text-xs text-amber">
          <span className="flex items-center gap-1">
            <ShieldIcon className="size-3.5" /> Compliance Audit
          </span>
          <span className="font-bold">v2.9.1 Targeted</span>
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-pink-surface p-5 shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-pink">Bugs &amp; Incidents</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-pink-hover text-pink">
            <BugIcon className="size-4" />
          </span>
        </header>
        <div className="my-3">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">2 P1 Blockers</span>
            <span className="rounded-full bg-pink-hover px-2 py-0.5 text-[11px] font-bold text-pink">Active Triaging</span>
          </p>
          <p className="mt-1.5 truncate text-xs text-pink">RTDN webhook timeout &amp; macOS crash dump</p>
        </div>
        <p className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-mint">
            <CircleCheckIcon className="size-3.5" /> SLA: 98.4% on track
          </span>
          <span className="font-bold text-foreground">MTTR: 28m</span>
        </p>
      </article>
    </section>
  )
}
