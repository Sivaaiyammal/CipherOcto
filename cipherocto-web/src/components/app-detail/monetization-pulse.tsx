import * as React from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { ActivityIcon } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  getPulseSeries,
  type AppDetail,
  type PulseMetric,
} from "@/data/app-details"
import type { PortfolioApp } from "@/data/apps"
import { formatCompact, formatCompactUsd, formatSignedPercent, integer, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const METRICS: { value: PulseMetric; label: string; unit: string }[] = [
  { value: "revenue", label: "Revenue ($)", unit: "Revenue" },
  { value: "installs", label: "Installs & DLs", unit: "Installs" },
  { value: "subscribers", label: "Subscribers", unit: "New subscribers" },
]

const chartConfig = {
  value: { label: "Daily", color: "var(--stream-mrr)" },
  trend: { label: "7-day avg", color: "var(--primary)" },
} satisfies ChartConfig

export function MonetizationPulse({ app, detail }: { app: PortfolioApp; detail: AppDetail }) {
  const [metric, setMetric] = React.useState<PulseMetric>("revenue")
  const data = React.useMemo(
    () => getPulseSeries(app, metric, detail.releaseDaysAgo),
    [app, metric, detail.releaseDaysAgo]
  )

  const fmt = (v: number) => (metric === "revenue" ? usd.format(v) : integer.format(Math.round(v)))
  const fmtAxis = (v: number) => (metric === "revenue" ? formatCompactUsd(v) : formatCompact(v))

  const stats = React.useMemo(() => {
    const peak = data.reduce((best, p) => (p.value > best.value ? p : best), data[0])
    const avg = (pts: typeof data) => pts.reduce((s, p) => s + p.value, 0) / Math.max(1, pts.length)
    const weekend = avg(data.filter((p) => p.isWeekend))
    const weekday = avg(data.filter((p) => !p.isWeekend))
    const releaseIdx = data.findIndex((p) => p.isRelease)
    const before = avg(data.slice(Math.max(0, releaseIdx - 7), releaseIdx))
    const after = avg(data.slice(releaseIdx))
    return {
      peak,
      weekendVelocity: (weekend / weekday - 1) * 100,
      releaseLift: before ? (after / before - 1) * 100 : 0,
      release: data[releaseIdx],
      // Keep the annotation inside the plot: put it left of the marker late in the range
      labelOnLeft: releaseIdx > data.length / 2,
    }
  }, [data])

  const thirdStat =
    metric === "revenue"
      ? { label: "Refund Rate", value: `${detail.refundRate.toFixed(2)}%`, note: "Under benchmark" }
      : metric === "installs"
        ? {
            label: "Avg Daily Installs",
            value: integer.format(Math.round(data.reduce((s, p) => s + p.value, 0) / data.length)),
            note: "last 30 days",
          }
        : { label: "Trial → Paid", value: `${detail.trialToPaid}%`, note: `Variant ${detail.paywallVariant}` }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex flex-col gap-4 @xl/main:flex-row @xl/main:items-start @xl/main:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            <ActivityIcon className="size-4.5 text-mint" />
            Monetization &amp; Acquisition Pulse
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Continuous telemetry across Apple App Store and Google Play billing pipelines.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Metric"
          className="flex shrink-0 self-start rounded-full bg-foreground/[0.05] p-1"
        >
          {METRICS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={metric === m.value}
              onClick={() => setMetric(m.value)}
              className={cn(
                "h-8 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                metric === m.value
                  ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-4 rounded-xl bg-background p-4 @xl/main:grid-cols-3">
        <div>
          <dt className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
            Peak Day {METRICS.find((m) => m.value === metric)?.unit}
          </dt>
          <dd className="mt-1 text-lg font-bold text-foreground tabular-nums">
            {fmt(stats.peak.value)}{" "}
            <span className="text-xs font-medium text-muted-foreground">
              / {stats.peak.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
            Weekend Velocity
          </dt>
          <dd className="mt-1 text-lg font-bold text-mint tabular-nums">
            {formatSignedPercent(stats.weekendVelocity)}{" "}
            <span className="text-xs font-medium text-muted-foreground">over weekday avg</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
            {thirdStat.label}
          </dt>
          <dd className="mt-1 text-lg font-bold text-foreground tabular-nums">
            {thirdStat.value}{" "}
            <span className="text-xs font-medium text-muted-foreground">({thirdStat.note})</span>
          </dd>
        </div>
      </dl>

      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <ComposedChart data={data} margin={{ top: 36, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={28}
            tickMargin={8}
          />
          <YAxis width={56} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
          <ChartTooltip
            cursor={{ fill: "var(--foreground)", fillOpacity: 0.04 }}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">
                      {name === "trend" ? "7-day avg" : "Daily"}
                    </span>
                    <span className="font-bold tabular-nums">{fmt(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          {stats.release && (
            <ReferenceLine
              x={stats.release.label}
              stroke="var(--primary)"
              strokeDasharray="4 4"
              label={{
                value: `${stats.release.label}: v${app.version} release (${formatSignedPercent(stats.releaseLift)} lift)`,
                position: stats.labelOnLeft ? "insideTopRight" : "insideTopLeft",
                offset: 0,
                dy: -28,
                className: "fill-foreground text-[11px] font-semibold",
              }}
            />
          )}
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={14}>
            {data.map((p) => (
              <Cell
                key={p.label}
                fill={
                  data.indexOf(p) >= data.findIndex((d) => d.isRelease)
                    ? "var(--stream-mrr)"
                    : "var(--stream-mrr-soft)"
                }
              />
            ))}
          </Bar>
          <Line
            dataKey="trend"
            type="monotone"
            stroke="var(--color-trend)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>
    </section>
  )
}
