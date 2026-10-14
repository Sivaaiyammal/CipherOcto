import * as React from "react"

import { DAYS, heatTone, MONTHLY_COHORTS, valuesFor, WEEKLY_COHORTS, type CohortAudience } from "@/data/analytics"
import { cn } from "@/lib/utils"

const CELL = {
  solid: "bg-mint font-bold text-white",
  high: "bg-mint-border font-bold text-mint",
  mid: "bg-mint-hover font-semibold text-mint",
  low: "bg-neutral-strong font-semibold text-muted-foreground",
  none: "bg-foreground/[0.04] text-muted-foreground",
} as const

const LEGEND = [
  { cls: "bg-mint", label: "70%+" },
  { cls: "bg-mint-border", label: "40-70%" },
  { cls: "bg-mint-hover", label: "20-40%" },
  { cls: "bg-neutral-strong", label: "<20%" },
]

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-foreground/[0.05] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap",
            value === o.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function CohortHeatmap({ factor }: { factor: number }) {
  const [audience, setAudience] = React.useState<CohortAudience>("all")
  const [grain, setGrain] = React.useState<"W" | "M">("M")
  const cohorts = grain === "M" ? MONTHLY_COHORTS : WEEKLY_COHORTS
  const lift = audience === "all" ? "+6.4% lift v2.9" : "+7.9% lift v2.9"

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">User Retention Cohort Heatmap</h2>
            <span className="rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-mint">{lift}</span>
          </div>
          <p className="text-xs text-muted-foreground">Percentage of retained users returning over milestone intervals.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Segmented
            label="Audience"
            value={audience}
            onChange={setAudience}
            options={[
              { value: "all", label: "All Users" },
              { value: "subscribers", label: "Subscribers" },
            ]}
          />
          <Segmented
            label="Granularity"
            value={grain}
            onChange={setGrain}
            options={[
              { value: "W", label: "W" },
              { value: "M", label: "M" },
            ]}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3 text-xs text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="size-2 rounded-full bg-mint" />
          <strong className="text-foreground">Release v2.9.0 (Sept 18)</strong>
          <span>Refactored first-time user experience and onboarding checklists.</span>
        </p>
        <span className="text-[11px] font-bold tracking-[0.04em] whitespace-nowrap text-mint">+6.4% D14 Booster</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="rounded-l-lg px-3 py-2.5">Cohort</th>
              <th className="px-3 py-2.5 text-right">Users</th>
              {DAYS.map((d, i) => (
                <th key={d} className={cn("px-3 py-2.5 text-center", i === DAYS.length - 1 && "rounded-r-lg")}>
                  Day {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => {
              const values = valuesFor(c, audience)
              return (
                <tr key={c.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {c.label}
                      {c.release && <span className="size-1.5 rounded-full bg-mint" title={c.release} />}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-muted-foreground tabular-nums">
                    {Math.round(c.users * factor).toLocaleString("en-US")}
                  </td>
                  {values.map((v, i) => (
                    <td key={DAYS[i]} className="px-1.5 py-1">
                      <div className={cn("rounded py-1.5 text-center tabular-nums", CELL[heatTone(v)])}>{v == null ? "—" : `${v.toFixed(1)}%`}</div>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <span>Color intensity represents higher relative persistence.</span>
        <span className="flex flex-wrap items-center gap-3">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded", l.cls)} />
              {l.label}
            </span>
          ))}
        </span>
      </footer>
    </section>
  )
}
