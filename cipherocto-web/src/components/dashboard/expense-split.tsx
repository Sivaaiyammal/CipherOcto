import {
  EXPENSE_SPLIT,
  formatCompactUsd,
} from "@/components/dashboard/revenue-data"

export function ExpenseSplit() {
  const total = EXPENSE_SPLIT.reduce((sum, e) => sum + e.value, 0)

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)]">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold tracking-[0.01em] text-foreground">
          Operational Expense Split
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCompactUsd(total)} Total
        </span>
      </header>

      <ul className="flex flex-col gap-3">
        {EXPENSE_SPLIT.map((e) => {
          const pct = Math.round((e.value / total) * 100)
          return (
            <li key={e.label} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-foreground/85">{e.label}</span>
                <span className="shrink-0 font-bold text-foreground tabular-nums">
                  {formatCompactUsd(e.value)} ({pct}%)
                </span>
              </div>
              <div
                role="meter"
                aria-label={e.label}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-neutral-strong"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: e.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
