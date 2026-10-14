import * as React from "react"
import { ArrowUpIcon, BarChart3Icon, BoltIcon, CircleDollarSignIcon, RepeatIcon, TrendingUpIcon, UsersIcon } from "lucide-react"

import { BASE } from "@/data/analytics"
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONES = {
  mint: { tile: "bg-mint-surface", title: "text-mint", badge: "bg-mint-border text-mint", pill: "bg-mint-border text-mint" },
  blue: { tile: "bg-blue-surface", title: "text-tertiary", badge: "bg-blue-hover text-tertiary", pill: "bg-blue-hover text-tertiary" },
  lavender: { tile: "bg-lavender-surface", title: "text-lavender", badge: "bg-lavender-hover text-lavender", pill: "bg-lavender-hover text-lavender" },
  stone: { tile: "bg-neutral-strong", title: "text-foreground", badge: "bg-card/70 text-foreground", pill: "bg-mint-border text-mint" },
  pink: { tile: "bg-pink-surface", title: "text-foreground", badge: "bg-pink-hover text-pink", pill: "bg-mint-border text-mint" },
} as const

function Tile({
  tone,
  title,
  icon,
  value,
  side,
  pill,
  note,
  extra,
}: {
  tone: keyof typeof TONES
  title: string
  icon: React.ReactNode
  value: string
  side?: React.ReactNode
  pill: React.ReactNode
  note?: string
  extra?: string
}) {
  const t = TONES[tone]
  return (
    <article className={cn("flex min-w-0 flex-col justify-between gap-2 rounded-xl p-4 shadow-[var(--shadow-1)]", t.tile)}>
      <header className="flex items-center justify-between gap-2">
        <h3 className={cn("text-[13px] leading-[18px] font-semibold tracking-[0.01em]", t.title)}>{title}</h3>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4", t.badge)}>{icon}</span>
      </header>
      <div className="flex items-end justify-between gap-2 pt-1">
        <p className="min-w-0 truncate text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
        {side}
      </div>
      {extra && <p className="-mt-1 text-xs text-muted-foreground">{extra}</p>}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1">
        <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap [&_svg]:size-3", t.pill)}>{pill}</span>
        {note && <span className="text-xs whitespace-nowrap text-muted-foreground">{note}</span>}
      </div>
    </article>
  )
}

export function AnalyticsKpis({ factor }: { factor: number }) {
  const mau = BASE.mau * factor
  const dau = BASE.dau * factor
  const arr = 3_100_000 * factor

  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5">
      <Tile
        tone="mint"
        title="Monthly Active Users"
        icon={<UsersIcon />}
        value={formatCompact(mau).toUpperCase()}
        side={
          <svg viewBox="0 0 100 35" fill="none" className="h-7 w-20 shrink-0 text-mint" aria-hidden="true">
            <path d="M0 28 Q 20 26, 40 18 T 80 12 T 100 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
          </svg>
        }
        pill={
          <>
            <TrendingUpIcon />
            +14.2%
          </>
        }
        note="vs last month"
      />
      <Tile
        tone="blue"
        title="DAU & Stickiness"
        icon={<BoltIcon />}
        value={`${formatCompact(dau).toUpperCase()}`}
        side={
          <div className="shrink-0 text-right leading-tight">
            <p className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">DAU/MAU</p>
            <p className="text-lg font-semibold text-foreground">{((dau / mau) * 100).toFixed(1)}%</p>
          </div>
        }
        pill={
          <>
            <TrendingUpIcon />
            +2.8%
          </>
        }
        note="vs benchmark"
      />
      <Tile
        tone="lavender"
        title="Retention D30 Avg"
        icon={<RepeatIcon />}
        value="28.4%"
        side={
          <div className="h-3 w-16 shrink-0 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-lavender" style={{ width: "78%" }} />
          </div>
        }
        pill={
          <>
            <ArrowUpIcon />
            +3.6%
          </>
        }
        note="category top 10%"
      />
      <Tile
        tone="stone"
        title="Avg Rev Per Paying User"
        icon={<CircleDollarSignIcon />}
        value="$18.42"
        extra={`Gross ARR $${(arr / 1_000_000).toFixed(1)}M`}
        pill={
          <>
            <TrendingUpIcon />
            +8.1%
          </>
        }
        note="30d trailing"
      />
      <Tile
        tone="pink"
        title="90-Day LTV Forecast"
        icon={<BarChart3Icon />}
        value="$34.20"
        side={
          <div className="shrink-0 text-right leading-tight">
            <p className="text-xs text-muted-foreground">Payback</p>
            <p className="text-[13px] font-semibold text-mint">18 Days</p>
          </div>
        }
        pill="Healthy 4.2x LTV/CAC"
      />
    </section>
  )
}
