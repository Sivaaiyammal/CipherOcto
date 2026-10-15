import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import {
  formatCompactUsd,
  revenueByApp,
  usd,
} from "@/components/dashboard/revenue-data"
import { useApps } from "@/data/apps-context"
import { NO_VALUE } from "@/lib/format"

export function RevenueByApp() {
  const { apps } = useApps()
  const items = React.useMemo(() => revenueByApp(apps), [apps])
  const chartConfig = React.useMemo(
    () => Object.fromEntries(items.map((a) => [a.app, { label: a.app, color: a.color }])) satisfies ChartConfig,
    [items]
  )

  const total = items.reduce((sum, a) => sum + a.value, 0)
  const [period] = React.useState(() =>
    new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
  )

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
          Revenue by App
        </h2>
        <span className="rounded-full bg-neutral-strong px-2.5 py-0.5 text-xs font-semibold text-foreground/80">
          {period}
        </span>
      </header>

      <div className="relative mx-auto size-44">
        <ChartContainer config={chartConfig} className="aspect-square size-44">
          <PieChart>
            {items.length > 0 ? (
              <Pie
                data={items}
                dataKey="value"
                nameKey="app"
                innerRadius={56}
                outerRadius={78}
                paddingAngle={2}
                cornerRadius={3}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                {items.map((a) => (
                  <Cell key={a.app} fill={a.color} />
                ))}
              </Pie>
            ) : (
              // Empty ring so the card keeps its shape until revenue is imported.
              <Pie
                data={[{ name: "none", value: 1 }]}
                dataKey="value"
                innerRadius={56}
                outerRadius={78}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                <Cell fill="var(--neutral-strong)" />
              </Pie>
            )}
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] text-muted-foreground">Total</span>
          <span className="text-xl font-bold tracking-[-0.02em] text-foreground tabular-nums">
            {items.length > 0 ? formatCompactUsd(total) : NO_VALUE}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 text-[13px]">
        {items.length === 0 && (
          <li className="text-center text-muted-foreground">
            No revenue imported yet. Connect Google Play to see it by app.
          </li>
        )}
        {items.map((a) => (
          <li key={a.app} className="flex items-center gap-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {a.app}
            </span>
            <span className="tabular-nums">
              <strong className="font-bold text-foreground">
                {total > 0 ? Math.round((a.value / total) * 100) : 0}%
              </strong>{" "}
              <span className="text-muted-foreground">({usd.format(a.value)})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
