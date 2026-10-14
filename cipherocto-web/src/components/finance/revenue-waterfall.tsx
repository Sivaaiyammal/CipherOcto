import * as React from "react"
import { Bar, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { PERIOD_LABEL, type MoneyFormat, type Period, type WaterfallBar } from "@/data/finance"
import { cn } from "@/lib/utils"

const config = {
  net: { label: "Net Cash Margin", color: "var(--stream-mrr)" },
  cut: { label: "App Store & Play Cut", color: "#FBBF24" },
  refunds: { label: "Refunds & Tax", color: "#F472B6" },
  gross: { label: "Gross Processed", color: "#60A5FA" },
} satisfies ChartConfig

const LEGEND = [
  { key: "gross", label: "Gross Processed", color: "#60A5FA" },
  { key: "cut", label: "App Store & Play Cut", color: "#FBBF24" },
  { key: "refunds", label: "Refunds & Tax", color: "#F472B6" },
  { key: "net", label: "Net Cash Margin", color: "var(--stream-mrr)" },
]

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
  const active = bars.find((b) => b.label === picked) ?? bars[bars.length - 1]

  const totalGross = bars.reduce((s, b) => s + b.gross, 0)
  const totalNet = bars.reduce((s, b) => s + b.net, 0)
  const blended = totalGross ? (totalNet / totalGross) * 100 : 0
  const margin = active.gross ? (active.net / active.gross) * 100 : 0

  const data = bars

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
          <div role="radiogroup" aria-label="Period" className="inline-flex shrink-0 self-start rounded-xl bg-foreground/[0.05] p-1 sm:self-auto">
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
                  "rounded-lg px-3 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap transition-colors",
                  period === p ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LEGEND.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5">
              <span className="size-3 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>

        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} onClick={(s) => s?.activeLabel && setPicked(String(s.activeLabel))}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} fontWeight={600} />
            <YAxis width={52} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => fmt(v, "compact")} />
            <Bar dataKey="net" stackId="a" fill="var(--color-net)" radius={[0, 0, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fillOpacity={d.label === active.label ? 1 : 0.55} cursor="pointer" />
              ))}
            </Bar>
            <Bar dataKey="cut" stackId="a" fill="var(--color-cut)" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fillOpacity={d.label === active.label ? 1 : 0.55} cursor="pointer" />
              ))}
            </Bar>
            <Bar dataKey="refunds" stackId="a" fill="var(--color-refunds)" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fillOpacity={d.label === active.label ? 1 : 0.55} cursor="pointer" />
              ))}
            </Bar>
            <Line dataKey="gross" type="monotone" stroke="var(--color-gross)" strokeWidth={3} dot={{ r: 4, fill: "#fff", strokeWidth: 3 }} isAnimationActive={false} />
          </ComposedChart>
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

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-background p-3 sm:grid-cols-3">
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
