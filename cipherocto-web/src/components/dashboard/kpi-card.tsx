import * as React from "react"
import { Area, AreaChart, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export type KpiTone =
  | "mint"
  | "indigo"
  | "stone"
  | "stone-deep"
  | "blue"
  | "lavender"
  | "amber"
  | "pink"

// Each tone pairs a tile surface with its title, badge, pill and line colors
// (DESIGN.md › Pastel Semantic Tiles).
const TONES: Record<
  KpiTone,
  {
    tile: string
    title: string
    badge: string
    pill: string
    line: string
    /** Compact variant: lighter surface and tone-colored title */
    softTile: string
    accent: string
  }
> = {
  mint: {
    tile: "bg-mint-hover",
    title: "text-mint",
    badge: "bg-mint-border/70 text-mint",
    pill: "bg-mint-border/70 text-mint",
    line: "var(--mint)",
    softTile: "bg-mint-surface",
    accent: "text-mint",
  },
  indigo: {
    tile: "bg-blue-surface",
    title: "text-foreground",
    badge: "bg-blue-hover text-tertiary",
    pill: "bg-blue-hover text-tertiary",
    line: "color-mix(in oklab, var(--tertiary) 55%, white)",
    softTile: "bg-blue-surface",
    accent: "text-tertiary",
  },
  stone: {
    tile: "bg-neutral-strong",
    title: "text-foreground",
    badge: "bg-card/70 text-foreground",
    pill: "bg-card/70 text-foreground",
    line: "var(--foreground)",
    softTile: "bg-neutral-strong",
    accent: "text-foreground",
  },
  "stone-deep": {
    tile: "bg-neutral-deep",
    title: "text-foreground",
    badge: "bg-card/60 text-foreground",
    pill: "bg-card/60 text-foreground",
    line: "color-mix(in oklab, var(--foreground) 70%, transparent)",
    softTile: "bg-neutral-deep",
    accent: "text-foreground",
  },
  blue: {
    tile: "bg-blue-surface",
    title: "text-tertiary",
    badge: "bg-blue-hover text-tertiary",
    pill: "bg-blue-hover text-tertiary",
    line: "var(--tertiary)",
    softTile: "bg-blue-surface",
    accent: "text-tertiary",
  },
  lavender: {
    tile: "bg-lavender-surface",
    title: "text-foreground",
    badge: "bg-lavender-hover text-lavender",
    pill: "bg-lavender-hover text-lavender",
    line: "var(--lavender)",
    softTile: "bg-lavender-surface",
    accent: "text-lavender",
  },
  amber: {
    tile: "bg-amber-surface",
    title: "text-foreground",
    badge: "bg-amber-hover text-amber",
    pill: "bg-amber-hover text-amber",
    line: "var(--amber)",
    softTile: "bg-amber-surface",
    accent: "text-amber",
  },
  pink: {
    tile: "bg-pink-surface",
    title: "text-foreground",
    badge: "bg-pink-hover text-pink",
    pill: "bg-pink-hover text-pink",
    line: "var(--pink)",
    softTile: "bg-pink-surface",
    accent: "text-pink",
  },
}

export type KpiCardProps = {
  title: string
  value: React.ReactNode
  /** Small suffix after the value, e.g. "MAU" */
  unit?: React.ReactNode
  icon: React.ReactNode
  tone: KpiTone
  delta: { label: string; icon: React.ReactNode }
  caption: React.ReactNode
  /** Sparkline points; when omitted, `children` fills that slot instead */
  trend?: number[]
  breakdown: { label: string; value: React.ReactNode }[]
  children?: React.ReactNode
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  tone,
  delta,
  caption,
  trend,
  breakdown,
  children,
}: KpiCardProps) {
  const t = TONES[tone]
  const gradientId = React.useId().replace(/:/g, "")
  const data = trend?.map((v, i) => ({ i, v }))
  const config = { v: { label: title, color: t.line } } satisfies ChartConfig

  return (
    <article
      className={cn(
        "@container/kpi flex min-w-0 flex-col gap-3 rounded-2xl p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-2)]",
        t.tile
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className={cn("truncate text-[13px] font-semibold tracking-[0.01em]", t.title)}>
          {title}
        </h3>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
            t.badge
          )}
        >
          {icon}
        </span>
      </header>

      <div>
        <p className="truncate text-2xl leading-9 font-bold tracking-[-0.02em] text-foreground tabular-nums">
          {value}
          {unit && (
            <span className="ml-1.5 text-xs font-medium tracking-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold tabular-nums [&_svg]:size-3",
              t.pill
            )}
          >
            {delta.icon}
            {delta.label}
          </span>
          {caption}
        </p>
      </div>

      {data ? (
        <ChartContainer
          config={config}
          className="-mx-1 mt-auto aspect-auto h-14 w-[calc(100%+0.5rem)]"
        >
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis
              hide
              domain={([min, max]: readonly number[]) => {
                // Pad relative to the range so tiny (%) and huge ($) series both read well
                const pad = (max - min || Math.abs(max) || 1) * 0.35
                return [min - pad, max + pad * 0.3]
              }}
            />
            <Area
              dataKey="v"
              type="monotone"
              stroke="var(--color-v)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="mt-auto">{children}</div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {breakdown.map((item) => (
          <span key={item.label}>
            {item.label}:{" "}
            <strong className="font-bold text-foreground">{item.value}</strong>
          </span>
        ))}
      </footer>
    </article>
  )
}

/** Small inline sparkline (no axes) for the compact card's pill row. */
function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const d = points
    .map((v, i) => {
      const x = 2 + (i / (points.length - 1)) * 56
      const y = 18 - ((v - min) / span) * 16
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg viewBox="0 0 60 20" preserveAspectRatio="none" className="h-6 w-11 shrink-0 @[13rem]/kpi:w-16" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type KpiCardCompactProps = Omit<KpiCardProps, "caption" | "children"> & {
  /** Right side of the pill row when there is no trend, e.g. "Variant V4" */
  aside?: React.ReactNode
}

/**
 * Denser KPI tile: tone-colored title, inline sparkline beside the delta pill,
 * and a single-row breakdown. Used on the app detail page.
 */
export function KpiCardCompact({
  title,
  value,
  unit,
  icon,
  tone,
  delta,
  trend,
  aside,
  breakdown,
}: KpiCardCompactProps) {
  const t = TONES[tone]
  return (
    <article
      className={cn(
        "@container/kpi flex min-w-0 flex-col justify-between gap-4 rounded-2xl p-4 shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-2)]",
        t.softTile
      )}
    >
      <div>
        <header className="flex items-center justify-between gap-2">
          <h3 className={cn("text-[13px] leading-[18px] font-semibold tracking-[0.01em]", t.accent)}>
            {title}
          </h3>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
              t.badge
            )}
          >
            {icon}
          </span>
        </header>
        <p className="mt-2 text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums @[13rem]/kpi:text-[32px]">
          {value}
          {unit && (
            <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span
            className={cn(
              "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-bold whitespace-nowrap tabular-nums [&_svg]:size-3",
              t.pill
            )}
          >
            {delta.icon}
            {delta.label}
          </span>
          {trend ? (
            <MiniSparkline points={trend} color={t.line} />
          ) : (
            aside && (
              <span className={cn("shrink-0 text-[11px] font-bold whitespace-nowrap tabular-nums", t.accent)}>
                {aside}
              </span>
            )
          )}
        </div>
        {/* Label over value in equal columns so nothing truncates in narrow tiles */}
        <dl
          className="grid gap-2 border-t border-foreground/[0.06] pt-2 text-[11px] tabular-nums"
          style={{ gridTemplateColumns: `repeat(${breakdown.length}, minmax(0, 1fr))` }}
        >
          {breakdown.map((item) => (
            <div key={item.label} className="min-w-0 leading-tight">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="mt-0.5 font-semibold whitespace-nowrap text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}
