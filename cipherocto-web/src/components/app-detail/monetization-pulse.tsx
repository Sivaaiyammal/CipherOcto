import * as React from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
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
  ios: { label: "App Store", color: "var(--stream-mrr)" },
  android: { label: "Google Play", color: "var(--stream-iap)" },
  trend: { label: "7-day avg", color: "var(--primary)" },
} satisfies ChartConfig

/** Pill-shaped release annotation drawn inside the chart's top margin. */
function ReleaseCallout({
  viewBox,
  text,
  alignRight,
}: {
  viewBox?: { x?: number; y?: number }
  text: string
  alignRight: boolean
}) {
  const x = viewBox?.x ?? 0
  const y = (viewBox?.y ?? 0) - 30
  const width = text.length * 6.1 + 26
  const left = alignRight ? x - width + 8 : x - 8
  return (
    <g>
      <rect x={left} y={y} width={width} height={22} rx={11} className="fill-card" stroke="var(--border)" />
      <circle cx={left + 12} cy={y + 11} r={3.5} className="fill-stream-mrr" />
      <text x={left + 21} y={y + 15} className="fill-foreground text-[11px] font-semibold">
        {text}
      </text>
    </g>
  )
}

export function MonetizationPulse({ app, detail }: { app: PortfolioApp; detail: AppDetail }) {
  const [metric, setMetric] = React.useState<PulseMetric>("revenue")
  const iosShare = detail.iosShare / 100
  const data = React.useMemo(
    () =>
      getPulseSeries(app, metric, detail.releaseDaysAgo).map((p) => ({
        ...p,
        ios: p.value * iosShare,
        android: p.value * (1 - iosShare),
      })),
    [app, metric, detail.releaseDaysAgo, iosShare]
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
    const total = data.reduce((s, p) => s + p.value, 0)
    return {
      peak,
      total,
      weekendVelocity: weekday ? (weekend / weekday - 1) * 100 : 0,
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
            value: integer.format(Math.round(stats.total / data.length)),
            note: "last 30 days",
          }
        : { label: "Trial → Paid", value: `${detail.trialToPaid}%`, note: `Variant ${detail.paywallVariant}` }

  const hasBoth = detail.iosShare > 0 && detail.iosShare < 100

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
            <span className="text-xs font-semibold text-mint">({thirdStat.note})</span>
          </dd>
        </div>
      </dl>

      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <ComposedChart data={data} margin={{ top: 40, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`pulse-${app.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mint-border)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--mint-border)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
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
                      {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                    </span>
                    <span className="font-bold tabular-nums">{fmt(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          <Area
            dataKey="trend"
            type="monotone"
            stroke="var(--color-trend)"
            strokeWidth={2.5}
            fill={`url(#pulse-${app.id})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {detail.iosShare > 0 && (
            <Bar dataKey="ios" stackId="platform" fill="var(--color-ios)" maxBarSize={14} />
          )}
          {detail.iosShare < 100 && (
            <Bar
              dataKey="android"
              stackId="platform"
              fill="var(--color-android)"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
          )}
          {stats.release && (
            <ReferenceLine
              x={stats.release.label}
              stroke="var(--primary)"
              strokeDasharray="4 4"
              label={
                <ReleaseCallout
                  alignRight={stats.labelOnLeft}
                  text={`${stats.release.label}: v${app.version} rollout (${formatSignedPercent(stats.releaseLift)} lift)`}
                />
              }
            />
          )}
        </ComposedChart>
      </ChartContainer>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {detail.iosShare > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="size-2.5 rounded-full bg-stream-mrr" />
              Apple App Store:{" "}
              <strong className="tabular-nums">
                {detail.iosShare}% ({fmt(stats.total * iosShare)})
              </strong>
            </span>
          )}
          {detail.iosShare < 100 && (
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-full bg-stream-iap" />
              Google Play Store:{" "}
              <strong className="text-foreground tabular-nums">
                {100 - detail.iosShare}% ({fmt(stats.total * (1 - iosShare))})
              </strong>
            </span>
          )}
        </div>
        {hasBoth && (
          <div className="flex h-2 overflow-hidden rounded-full bg-neutral-strong">
            <div className="h-full bg-stream-mrr" style={{ width: `${detail.iosShare}%` }} />
            <div className="h-full bg-stream-iap" style={{ width: `${100 - detail.iosShare}%` }} />
          </div>
        )}
      </div>
    </section>
  )
}
