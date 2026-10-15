import * as React from "react"
import {
  ActivityIcon,
  BanknoteIcon,
  LayoutGridIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import type { PortfolioApp } from "@/data/apps"
import { formatCompact, formatCompactUsd, NO_VALUE, orDash } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tone = "indigo" | "mint" | "stone" | "blue" | "pink"

const TONES: Record<Tone, { tile: string; title: string; badge: string; pill: string }> = {
  indigo: {
    tile: "bg-blue-surface",
    title: "text-tertiary",
    badge: "bg-blue-hover text-tertiary",
    pill: "bg-blue-hover text-tertiary",
  },
  mint: {
    tile: "bg-mint-surface",
    title: "text-mint",
    badge: "bg-mint-hover text-mint",
    pill: "bg-mint-hover text-mint",
  },
  stone: {
    tile: "bg-neutral-strong",
    title: "text-foreground",
    badge: "bg-card/70 text-foreground",
    pill: "bg-card/70 text-foreground",
  },
  blue: {
    tile: "bg-lavender-surface",
    title: "text-lavender",
    badge: "bg-lavender-hover text-lavender",
    pill: "bg-lavender-hover text-lavender",
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
  pill,
  caption,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  tone: Tone
  value: React.ReactNode
  unit?: React.ReactNode
  pill: React.ReactNode
  caption: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <article
      className={cn(
        "@container/tile flex min-h-[148px] min-w-0 flex-col justify-between gap-2 rounded-2xl p-4 shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]",
        t.tile
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <h3 className={cn("truncate text-[13px] font-semibold tracking-[0.01em]", t.title)}>{title}</h3>
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
      <p className="flex items-baseline gap-1.5 text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums @[12rem]/tile:text-[32px]">
        {value}
        {unit && (
          <span className="text-sm font-normal tracking-normal text-muted-foreground">{unit}</span>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
        <span
          className={cn(
            "inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[11px] font-bold whitespace-nowrap tabular-nums [&_svg]:size-3",
            t.pill
          )}
        >
          {pill}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{caption}</span>
      </div>
    </article>
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

/** Sum of the non-null values, or null when no app reports the metric. */
function sumKnown(apps: PortfolioApp[], pick: (a: PortfolioApp) => number | null): number | null {
  let total = 0
  let any = false
  for (const a of apps) {
    const v = pick(a)
    if (v !== null) {
      total += v
      any = true
    }
  }
  return any ? total : null
}

/** Average of `value` weighted by `weight`, over apps that report both. */
function weighted(
  apps: PortfolioApp[],
  value: (a: PortfolioApp) => number | null,
  weight: (a: PortfolioApp) => number | null
): number | null {
  let num = 0
  let den = 0
  for (const a of apps) {
    const v = value(a)
    const w = weight(a)
    if (v !== null && w !== null && w > 0) {
      num += v * w
      den += w
    }
  }
  return den ? num / den : null
}

export function AppsSummary({ apps }: { apps: PortfolioApp[] }) {
  const totals = React.useMemo(() => {
    const revenue = sumKnown(apps, (a) => a.revenueMonthly)
    const subscribers = sumKnown(apps, (a) => a.subscribers)
    return {
      count: apps.length,
      inProduction: apps.filter((a) => a.status.kind === "live").length,
      inDevelopment: apps.filter((a) => a.status.kind === "development").length,
      mau: sumKnown(apps, (a) => a.mau),
      installs: sumKnown(apps, (a) => a.installs30d),
      revenue,
      arppu: revenue !== null && subscribers ? revenue / subscribers : null,
      // Weighted so large apps dominate, as they do in practice
      crashFree: weighted(apps, (a) => a.crashFree, (a) => a.mau),
      rating: weighted(apps, (a) => a.rating, (a) => a.ratingCount),
      ratingCount: sumKnown(apps, (a) => a.ratingCount),
      rollouts: apps.filter((a) => a.status.kind === "staged").length,
    }
  }, [apps])

  return (
    <section
      aria-label="Portfolio summary"
      className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5"
    >
      <SummaryTile
        title="Portfolio Fleet"
        subtitle="Registered apps"
        icon={<LayoutGridIcon />}
        tone="indigo"
        value={totals.count}
        unit="apps"
        pill={`${totals.inProduction} Live`}
        caption={`${totals.inDevelopment} in development`}
      />
      <SummaryTile
        title="Global Audience"
        subtitle="30-day aggregated"
        icon={<UsersIcon />}
        tone="mint"
        value={orDash(totals.mau, formatCompact)}
        unit={<span className="font-semibold text-mint">MAU</span>}
        pill={
          <>
            <TrendingUpIcon />
            {NO_VALUE} MoM
          </>
        }
        caption={`${orDash(totals.installs, formatCompact)} installs`}
      />
      <SummaryTile
        title="Gross Revenue"
        subtitle="Blended MRR + IAP"
        icon={<BanknoteIcon />}
        tone="stone"
        value={orDash(totals.revenue, formatCompactUsd)}
        unit="/mo"
        pill={`${orDash(totals.arppu, (n) => `$${n.toFixed(2)}`)} ARPPU`}
        caption={<span className="font-medium">MRR {NO_VALUE}</span>}
      />
      <SummaryTile
        title="Fleet Reliability"
        subtitle="Crash telemetry"
        icon={<ActivityIcon />}
        tone="blue"
        value={orDash(totals.crashFree, (n) => `${n.toFixed(2)}%`)}
        pill={`${totals.rollouts} Rollout${totals.rollouts === 1 ? "" : "s"}`}
        caption={totals.crashFree === null ? "Not connected" : "Crash-free sessions"}
      />
      <SummaryTile
        title="Store Reputation"
        subtitle={`${orDash(totals.ratingCount, formatCompact)} verified ratings`}
        icon={<StarIcon className="fill-current" />}
        tone="pink"
        value={orDash(totals.rating, (n) => n.toFixed(2))}
        unit={<Stars rating={totals.rating ?? 0} />}
        pill={`${NO_VALUE} QoQ`}
        caption="Google Play"
      />
    </section>
  )
}
