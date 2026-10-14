import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { PERIOD_LABEL, type MoneyFormat, type Period, type WaterfallBar } from "@/data/finance"
import { cn } from "@/lib/utils"

type SeriesKey = "gross" | "cut" | "refunds" | "net"

const SERIES: { key: SeriesKey; label: string; color: string; soft: string; chip: string }[] = [
  { key: "gross", label: "Gross Processed", color: "#60A5FA", soft: "color-mix(in srgb, #60A5FA 35%, white)", chip: "bg-blue-surface text-tertiary" },
  { key: "cut", label: "App Store & Play Cut", color: "#FBBF24", soft: "color-mix(in srgb, #FBBF24 38%, white)", chip: "bg-amber-surface text-amber" },
  { key: "refunds", label: "Refunds & Tax", color: "#F472B6", soft: "color-mix(in srgb, #F472B6 35%, white)", chip: "bg-pink-surface text-pink" },
  { key: "net", label: "Net Cash Margin", color: "var(--stream-mrr)", soft: "color-mix(in srgb, var(--stream-mrr) 35%, white)", chip: "bg-mint-surface text-mint" },
]

const chartConfig = Object.fromEntries(SERIES.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig

function BreakdownTooltip({
  active,
  payload,
  fmt,
}: {
  active?: boolean
  payload?: { payload: WaterfallBar }[]
  fmt: MoneyFormat
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="min-w-52 rounded-xl bg-primary px-3 py-2.5 text-primary-foreground shadow-[var(--shadow-3)]">
      <p className="mb-1.5 border-b border-white/10 pb-1.5 text-[13px] font-bold text-mint-border">{row.label} Breakdown</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[13px] tabular-nums">
        {SERIES.map((s) => (
          <React.Fragment key={s.key}>
            <dt className="text-primary-foreground/75">{s.label}:</dt>
            <dd className="text-right font-bold">{fmt(row[s.key])}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  )
}

function CategoryTick({
  x,
  y,
  payload,
  index,
  activeIndex,
}: {
  x?: number | string
  y?: number | string
  payload?: { value: string }
  index?: number
  activeIndex: number
}) {
  return (
    <text
      x={x}
      y={y}
      dy={14}
      textAnchor="middle"
      className={cn("text-xs", index === activeIndex ? "fill-foreground font-bold" : "fill-muted-foreground")}
    >
      {payload?.value}
    </text>
  )
}

export function RevenueWaterfall({
  period,
  onPeriod,
  bars,
  fmt,
}: {
  period: Period
  onPeriod: (p: Period) => void
  bars: WaterfallBar[]
  fmt: MoneyFormat
}) {
  const [picked, setPicked] = React.useState<string | null>(null)
  const [hidden, setHidden] = React.useState<Set<SeriesKey>>(new Set())

  const lastIndex = bars.length - 1
  const pickedIndex = bars.findIndex((b) => b.label === picked)
  const activeIndex = pickedIndex >= 0 ? pickedIndex : lastIndex
  const active = bars[activeIndex]

  const totalGross = bars.reduce((s, b) => s + b.gross, 0)
  const totalNet = bars.reduce((s, b) => s + b.net, 0)
  const blended = totalGross ? (totalNet / totalGross) * 100 : 0
  const margin = active.gross ? (active.net / active.gross) * 100 : 0

  const toggle = (key: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <section className="flex min-w-0 flex-col justify-between rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">Revenue Waterfall &amp; Net Payout Trajectory</h2>
            <p className="text-xs text-muted-foreground">
              Breakdown of gross sales, app platform cuts, direct infrastructure compute, and net retained margins.
            </p>
          </div>
          <div role="radiogroup" aria-label="Period" className="flex shrink-0 self-start rounded-xl bg-foreground/[0.05] p-1 sm:self-auto">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={period === p}
                onClick={() => {
                  setPicked(null)
                  onPeriod(p)
                }}
                className={cn(
                  "h-7 rounded-lg px-3 text-[11px] font-bold tracking-[0.02em] whitespace-nowrap transition-colors",
                  period === p ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SERIES.map((s) => {
            const isHidden = hidden.has(s.key)
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={!isHidden}
                onClick={() => toggle(s.key)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold tracking-[0.04em] transition-opacity",
                  s.chip,
                  isHidden && "opacity-45"
                )}
              >
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            )
          })}
        </div>

        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart
            data={bars}
            barGap={6}
            barCategoryGap="12%"
            margin={{ left: 0, right: 0, top: 8 }}
            onClick={(s) => s?.activeLabel != null && setPicked(String(s.activeLabel))}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={0}
              tick={<CategoryTick activeIndex={activeIndex} />}
            />
            <YAxis width={52} tickLine={false} axisLine={false} tickCount={5} tickFormatter={(v: number) => fmt(v, "compact")} className="tabular-nums" />
            <ChartTooltip cursor={false} defaultIndex={activeIndex} content={<BreakdownTooltip fmt={fmt} />} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} hide={hidden.has(s.key)} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {bars.map((row, i) => (
                  <Cell key={row.label} fill={i === activeIndex ? s.color : s.soft} cursor="pointer" />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span className="size-2.5 rounded-full bg-stream-mrr" />
            <strong className="text-foreground">{active.label} Detailed P&amp;L Clearance:</strong>
            <span className="text-muted-foreground">Gross: {fmt(active.gross, "compact")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Store Cut: -{fmt(active.cut, "compact")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Taxes/Refunds: -{fmt(active.refunds, "compact")}</span>
          </p>
          <p className="text-[13px] font-bold whitespace-nowrap text-mint">
            Net Margin: {fmt(active.net, "compact")} ({Math.round(margin)}%)
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-foreground/[0.035] p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Blended Net Margin</p>
          <p className="text-lg font-bold text-foreground tabular-nums">{blended.toFixed(1)}%</p>
          <p className="text-xs font-medium text-mint">Top quartile for mobile SaaS</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Quick Ratio (Acid Test)</p>
          <p className="text-lg font-bold text-foreground">3.4x</p>
          <p className="text-xs text-muted-foreground">Zero short-term debt obligation</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net Cash Runway</p>
          <p className="text-lg font-bold text-foreground">28 Months</p>
          <p className="text-xs font-medium text-mint">Fully cash-flow positive</p>
        </div>
      </div>
    </section>
  )
}
