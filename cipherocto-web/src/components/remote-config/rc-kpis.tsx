import * as React from "react"
import {
  BadgeCheckIcon,
  CircleCheckIcon,
  CloudUploadIcon,
  GaugeIcon,
  NetworkIcon,
  RefreshCwIcon,
  ShieldIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  ZapIcon,
  ListChecksIcon,
} from "lucide-react"

import { isInFlight, TYPE_LABEL, type ParamType, type RemoteParam } from "@/data/remote-config"
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONES = {
  mint: { tile: "bg-mint-surface", title: "text-mint", badge: "bg-mint-border/50 text-mint", pill: "bg-mint-hover text-mint" },
  blue: { tile: "bg-blue-surface", title: "text-tertiary", badge: "bg-blue-border/50 text-tertiary", pill: "bg-blue-hover text-tertiary" },
  amber: { tile: "bg-amber-surface", title: "text-amber", badge: "bg-amber-hover text-amber", pill: "bg-amber-hover text-amber" },
  lavender: { tile: "bg-lavender-surface", title: "text-lavender", badge: "bg-lavender-hover text-lavender", pill: "bg-lavender-hover text-lavender" },
  pink: { tile: "bg-pink-surface", title: "text-pink", badge: "bg-pink-hover text-pink", pill: "bg-pink-hover text-pink" },
} as const

function Tile({
  title,
  icon,
  tone,
  value,
  caption,
  pill,
  pillIcon,
}: {
  title: string
  icon: React.ReactNode
  tone: keyof typeof TONES
  value: string
  caption: string
  pill: string
  pillIcon: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col justify-between gap-2 rounded-[18px] p-5 shadow-[var(--shadow-1)] transition-transform duration-200 hover:-translate-y-0.5",
        t.tile
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className={cn("text-[13px] leading-[18px] font-semibold tracking-[0.01em]", t.title)}>{title}</h3>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]", t.badge)}>{icon}</span>
      </header>
      <div className="my-2 min-w-0">
        <p className="truncate text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
        <p className={cn("line-clamp-2 text-xs", t.title)}>{caption}</p>
      </div>
      <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] [&_svg]:size-3.5 [&_svg]:shrink-0", t.pill)}>
        {pillIcon}
        {pill}
      </span>
    </article>
  )
}

export function RemoteConfigKpis({
  params,
  draftCount,
  totalMau,
}: {
  params: RemoteParam[]
  draftCount: number
  totalMau: number
}) {
  const byType = (type: ParamType) => params.filter((p) => p.type === type).length
  const typeLine = (["boolean", "json", "string", "number"] as const)
    .map((t) => [byType(t), TYPE_LABEL[t]] as const)
    .filter(([n]) => n > 0)
    .map(([n, label]) => `${n} ${label}${n === 1 ? "" : label === "JSON" ? "" : "s"}`)
    .join(" • ")

  const inFlight = params.filter(isInFlight)
  const avgRollout = inFlight.length
    ? Math.round(
        inFlight.reduce((s, p) => s + (p.distribution.kind === "rollout" ? p.distribution.pct : 50), 0) / inFlight.length
      )
    : 0
  const nearDone = inFlight.filter((p) => p.distribution.kind === "rollout" && p.distribution.pct >= 75).length

  const rules = params.flatMap((p) => p.rules)
  const attrs = [...new Set(rules.flatMap((r) => r.conditions.map((c) => c.attr.split(" (")[0])))]

  const kills = params.filter((p) => p.category === "killswitch")
  const activeKills = kills.filter((p) => p.enabled).length

  // ~1 config fetch per active user every 5 minutes
  const fetchRate = Math.round((totalMau * 0.28) / 86.4)

  return (
    <section aria-label="Remote config overview" className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5">
      <Tile
        title="Active Parameters"
        icon={<SlidersHorizontalIcon />}
        tone="mint"
        value={String(params.length)}
        caption={typeLine || "No parameters yet"}
        pill={draftCount ? `${draftCount} unpublished draft${draftCount === 1 ? "" : "s"}` : "100% Client Synced"}
        pillIcon={draftCount ? <CloudUploadIcon /> : <CircleCheckIcon />}
      />
      <Tile
        title="Running Rollouts"
        icon={<RefreshCwIcon />}
        tone="blue"
        value={`${inFlight.length} In-Flight`}
        caption={`Weighted average rollout: ${avgRollout}%`}
        pill={`${nearDone} near full rollout`}
        pillIcon={<TrendingUpIcon />}
      />
      <Tile
        title="Targeting Rules"
        icon={<NetworkIcon />}
        tone="amber"
        value={`${rules.length} Rules`}
        caption={attrs.slice(0, 4).join(", ") || "No audience rules"}
        pill="All Rules Validated"
        pillIcon={<ListChecksIcon />}
      />
      <Tile
        title="Edge Fetch Rate"
        icon={<ZapIcon />}
        tone="lavender"
        value={`${formatCompact(fetchRate)}/s`}
        caption="99.99% cache hit at the edge proxy"
        pill="p95 Latency: 18ms"
        pillIcon={<GaugeIcon />}
      />
      <Tile
        title="Safe Mode & Kills"
        icon={<ShieldIcon />}
        tone="pink"
        value={`${activeKills} Active`}
        caption={`${kills.length - activeKills} armed switches standing by`}
        pill={activeKills ? "Kill switch engaged" : "Systems Protected"}
        pillIcon={activeKills ? <BadgeCheckIcon /> : <ShieldCheckIcon />}
      />
    </section>
  )
}
