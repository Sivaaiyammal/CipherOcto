import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { TrendingUpIcon, Undo2Icon, UserRoundIcon } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  formatCompactUsd,
  getRevenueData,
  usd,
  type RevenuePeriod,
  type RevenueRow,
} from "@/components/dashboard/revenue-data"
import { cn } from "@/lib/utils"

type StreamKey = "mrr" | "iap" | "ads"

const STREAMS: {
  key: StreamKey
  label: string
  tooltipLabel: string
  chip: string
  dot: string
}[] = [
  {
    key: "mrr",
    label: "Subscriptions (MRR)",
    tooltipLabel: "Subscriptions",
    chip: "bg-mint-surface text-mint",
    dot: "bg-stream-mrr",
  },
  {
    key: "iap",
    label: "In-App Purchases (IAP)",
    tooltipLabel: "In-App Purchases",
    chip: "bg-stream-iap-soft/60 text-foreground/80",
    dot: "bg-stream-iap",
  },
  {
    key: "ads",
    label: "Ad Network Payouts",
    tooltipLabel: "Ad Revenue",
    chip: "bg-neutral-strong text-foreground/80",
    dot: "bg-stream-ads",
  },
]

const PERIODS: { value: RevenuePeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
]

const chartConfig = {
  mrr: { label: "Subscriptions", color: "var(--stream-mrr)" },
  iap: { label: "In-App Purchases", color: "var(--stream-iap)" },
  ads: { label: "Ad Revenue", color: "var(--stream-ads)" },
} satisfies ChartConfig

function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: RevenueRow }[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <div className="min-w-52 rounded-xl bg-primary px-3 py-2.5 text-primary-foreground shadow-[var(--shadow-3)]">
      <p className="mb-1.5 border-b border-white/10 pb-1.5 text-[13px] font-bold text-mint-border">
        {row.title} Breakdown
      </p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[13px] tabular-nums">
        {STREAMS.map((s) => (
          <React.Fragment key={s.key}>
            <dt className="text-primary-foreground/75">{s.tooltipLabel}:</dt>
            <dd className="text-right font-bold">{usd.format(row[s.key])}</dd>
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
  lastIndex,
}: {
  x?: number | string
  y?: number | string
  payload?: { value: string }
  index?: number
  lastIndex: number
}) {
  const isCurrent = index === lastIndex
  return (
    <text
      x={x}
      y={y}
      dy={14}
      textAnchor="middle"
      className={cn(
        "text-xs",
        isCurrent ? "fill-foreground font-bold" : "fill-muted-foreground"
      )}
    >
      {payload?.value}
    </text>
  )
}

function SummaryStat({
  icon,
  tone,
  label,
  value,
  note,
  noteClass,
}: {
  icon: React.ReactNode
  tone: string
  label: string
  value: string
  note: string
  noteClass?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-4",
          tone
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-[13px] font-bold text-foreground tabular-nums">
          {value}{" "}
          <span className={cn("font-medium", noteClass)}>{note}</span>
        </p>
      </div>
    </div>
  )
}

export function RevenueOverview() {
  const [period, setPeriod] = React.useState<RevenuePeriod>("monthly")
  const [hidden, setHidden] = React.useState<Set<StreamKey>>(new Set())
  const data = React.useMemo(() => getRevenueData(period), [period])
  const lastIndex = data.length - 1

  const toggleStream = (key: StreamKey) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex flex-col gap-4 @xl/main:flex-row @xl/main:items-start @xl/main:justify-between">
        <div className="max-w-md">
          <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            Revenue Overview &amp; Streams
          </h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            Aggregated subscriptions, ad monetization, and consumer
            microtransactions.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Period"
          className="flex shrink-0 self-start rounded-xl bg-foreground/[0.05] p-1"
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-7 rounded-lg px-3 text-[11px] font-bold tracking-[0.02em] transition-colors",
                period === p.value
                  ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {STREAMS.map((s) => {
          const isHidden = hidden.has(s.key)
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={!isHidden}
              onClick={() => toggleStream(s.key)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold tracking-[0.04em] transition-opacity",
                s.chip,
                isHidden && "opacity-45"
              )}
            >
              <span className={cn("size-2 rounded-full", s.dot)} />
              {s.label}
            </button>
          )
        })}
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} barGap={6} barCategoryGap="12%" margin={{ left: 0, right: 0, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={0}
            tick={<CategoryTick lastIndex={lastIndex} />}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            tickFormatter={(v: number) => formatCompactUsd(v)}
            className="tabular-nums"
          />
          <ChartTooltip
            cursor={false}
            defaultIndex={lastIndex}
            content={<BreakdownTooltip />}
          />
          {STREAMS.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              hide={hidden.has(s.key)}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            >
              {data.map((row, i) => (
                <Cell
                  key={row.label}
                  fill={
                    i === lastIndex
                      ? `var(--stream-${s.key})`
                      : `var(--stream-${s.key}-soft)`
                  }
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-foreground/[0.035] p-4 @xl/main:grid-cols-3">
        <SummaryStat
          icon={<UserRoundIcon />}
          tone="bg-mint-border/70 text-mint"
          label="Avg. Revenue / User"
          value="$4.32"
          note="(+6%)"
          noteClass="text-mint"
        />
        <SummaryStat
          icon={<Undo2Icon />}
          tone="bg-neutral-strong text-foreground"
          label="Refund Rate"
          value="0.38%"
          note="(Very Low)"
          noteClass="text-mint"
        />
        <SummaryStat
          icon={<TrendingUpIcon />}
          tone="bg-blue-hover text-tertiary"
          label="Annual Run Rate (ARR)"
          value="$2.21M"
          note="paced"
          noteClass="text-muted-foreground"
        />
      </div>
    </section>
  )
}
