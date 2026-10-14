import * as React from "react"
import {
  ActivityIcon,
  BanknoteIcon,
  LayoutGridIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"

import { APP_QUOTA, type PortfolioApp } from "@/data/apps"
import { formatCompact, formatCompactUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tone = "indigo" | "mint" | "stone" | "blue" | "pink"

const TONES: Record<Tone, { tile: string; title: string; badge: string; pill: string }> = {
  indigo: {
    tile: "bg-blue-surface",
    title: "text-foreground",
    badge: "bg-blue-hover text-tertiary",
    pill: "bg-blue-hover text-tertiary",
  },
  mint: {
    tile: "bg-mint-hover",
    title: "text-mint",
    badge: "bg-mint-border/70 text-mint",
    pill: "bg-mint-border/70 text-mint",
  },
  stone: {
    tile: "bg-neutral-strong",
    title: "text-foreground",
    badge: "bg-card/70 text-foreground",
    pill: "bg-card/70 text-foreground",
  },
  blue: {
    tile: "bg-blue-surface",
    title: "text-tertiary",
    badge: "bg-blue-hover text-tertiary",
    pill: "bg-blue-hover text-tertiary",
  },
  pink: {
    tile: "bg-pink-surface",
    title: "text-foreground",
    badge: "bg-pink-hover text-pink",
    pill: "bg-pink-hover text-pink",
  },
}

function SummaryTile({
  title,
  subtitle,
  icon,
  tone,
  value,
  unit,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  tone: Tone
  value: React.ReactNode
  unit?: React.ReactNode
  children: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <article className={cn("@container/tile flex min-w-0 flex-col gap-3 rounded-2xl p-4", t.tile)}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <h3 className={cn("truncate text-[15px] font-semibold", t.title)}>{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
            t.badge
          )}
        >
          {icon}
        </span>
      </header>
      <p className="flex items-baseline gap-1.5 text-2xl leading-9 font-bold tracking-[-0.02em] text-foreground tabular-nums @[11rem]/tile:text-[28px]">
        {value}
        {unit && (
          <span className="text-xs font-medium tracking-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {children}
      </div>
    </article>
  )
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold tabular-nums",
        TONES[tone].pill
      )}
    >
      {children}
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" aria-label={`${rating.toFixed(2)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-3",
            i < Math.round(rating) ? "fill-foreground text-foreground" : "text-foreground/25"
          )}
        />
      ))}
    </span>
  )
}

export function AppsSummary({ apps }: { apps: PortfolioApp[] }) {
  const totals = React.useMemo(() => {
    const sum = (pick: (a: PortfolioApp) => number) =>
      apps.reduce((acc, a) => acc + pick(a), 0)
    const mau = sum((a) => a.mau)
    const ratingCount = sum((a) => a.ratingCount)
    const revenue = sum((a) => a.revenueMonthly)
    const subscribers = sum((a) => a.subscribers)
    return {
      count: apps.length,
      mau,
      installs: sum((a) => a.installs30d),
      revenue,
      subscribers,
      arppu: subscribers ? revenue / subscribers : 0,
      // Weighted so large apps dominate, as they do in practice
      crashFree: mau ? sum((a) => a.crashFree * a.mau) / mau : 0,
      rating: ratingCount ? sum((a) => a.rating * a.ratingCount) / ratingCount : 0,
      ratingCount,
      rollouts: apps.filter((a) => a.status.kind === "staged").length,
    }
  }, [apps])

  const quotaUsed = Math.round((totals.count / APP_QUOTA) * 100)

  return (
    <section
      aria-label="Portfolio summary"
      className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5"
    >
      <SummaryTile
        title="Portfolio Fleet"
        subtitle="Active instances"
        icon={<LayoutGridIcon />}
        tone="indigo"
        value={totals.count}
        unit={`/ ${APP_QUOTA} Quota`}
      >
        <Pill tone="indigo">{quotaUsed}% Used</Pill>
        {APP_QUOTA - totals.count} slots free
      </SummaryTile>

      <SummaryTile
        title="Global Audience"
        subtitle="30-day aggregated"
        icon={<UsersIcon />}
        tone="mint"
        value={formatCompact(totals.mau)}
        unit="MAU"
      >
        <Pill tone="mint">+14.2% MoM</Pill>
        {formatCompact(totals.installs)} installs
      </SummaryTile>

      <SummaryTile
        title="Gross Revenue"
        subtitle="Blended MRR + IAP"
        icon={<BanknoteIcon />}
        tone="stone"
        value={formatCompactUsd(totals.revenue)}
        unit="/mo"
      >
        <span className="rounded-lg bg-card/70 px-2 py-1 leading-tight">
          <strong className="block font-bold text-foreground tabular-nums">
            ${totals.arppu.toFixed(2)}
          </strong>
          ARPPU
        </span>
        <span className="rounded-lg bg-card/70 px-2 py-1 leading-tight">
          <strong className="block font-bold text-foreground tabular-nums">
            {formatCompact(totals.subscribers)}
          </strong>
          Paying users
        </span>
      </SummaryTile>

      <SummaryTile
        title="Fleet Reliability"
        subtitle="Crash-free sessions"
        icon={<ActivityIcon />}
        tone="blue"
        value={`${totals.crashFree.toFixed(2)}%`}
      >
        <Pill tone="blue">
          {totals.rollouts} Rollout{totals.rollouts === 1 ? "" : "s"}
        </Pill>
        0 outages
      </SummaryTile>

      <SummaryTile
        title="Store Reputation"
        subtitle={`${formatCompact(totals.ratingCount)} verified ratings`}
        icon={<StarIcon />}
        tone="pink"
        value={totals.rating.toFixed(2)}
        unit={<Stars rating={totals.rating} />}
      >
        <Pill tone="pink">+0.12 QoQ</Pill>
        iOS &amp; Android
      </SummaryTile>
    </section>
  )
}
