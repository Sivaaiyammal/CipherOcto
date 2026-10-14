import * as React from "react"
import {
  ArrowUpIcon,
  ArrowUpRightIcon,
  CircleCheckIcon,
  CircleDollarSignIcon,
  HeartHandshakeIcon,
  RefreshCcwDotIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import type { Product } from "@/data/subscriptions"
import { formatCompact, integer, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONES = {
  mint: { tile: "bg-mint-surface", title: "text-mint", badge: "bg-mint-border/50 text-mint", delta: "text-mint" },
  blue: { tile: "bg-blue-surface", title: "text-tertiary", badge: "bg-blue-hover text-tertiary", delta: "text-tertiary" },
  stone: { tile: "bg-neutral-strong", title: "text-foreground", badge: "bg-card/70 text-foreground", delta: "text-mint" },
  lavender: { tile: "bg-lavender-surface", title: "text-lavender", badge: "bg-lavender-hover text-lavender", delta: "text-lavender" },
  pink: { tile: "bg-pink-surface", title: "text-pink", badge: "bg-pink-hover text-pink", delta: "text-mint" },
} as const

function Tile({
  title,
  icon,
  tone,
  value,
  delta,
  deltaIcon,
  left,
  right,
}: {
  title: string
  icon: React.ReactNode
  tone: keyof typeof TONES
  value: string
  delta: string
  deltaIcon: React.ReactNode
  left: React.ReactNode
  right: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <article className={cn("flex min-w-0 flex-col justify-between rounded-xl p-5 shadow-[var(--shadow-1)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-2)]", t.tile)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className={cn("text-[13px] leading-[18px] font-semibold tracking-[0.01em]", t.title)}>{title}</h3>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]", t.badge)}>{icon}</span>
      </header>
      <div className="mb-3 space-y-1">
        <p className="truncate text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
        <p className={cn("flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] [&_svg]:size-3.5 [&_svg]:shrink-0", t.delta)}>
          {deltaIcon}
          <span className="truncate">{delta}</span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground tabular-nums">
        <span className="truncate">{left}</span>
        <span className="shrink-0">{right}</span>
      </div>
    </article>
  )
}

export function SubscriptionKpis({ products }: { products: Product[] }) {
  const recurring = products.filter((p) => p.kind === "auto-renewable" || p.kind === "promo")
  const mrr = recurring.reduce((s, p) => s + p.mrr, 0)
  const annualMrr = recurring.filter((p) => p.term === "yr").reduce((s, p) => s + p.mrr, 0)
  const annualShare = mrr ? Math.round((annualMrr / mrr) * 100) : 0
  const subs = recurring.reduce((s, p) => s + p.count, 0)
  const arpu = subs ? mrr / subs : 0
  // LTV ≈ ARPU / monthly churn (1.38%), capped to a 24-month horizon
  const ltv = arpu * Math.min(24, 1 / 0.0138)

  return (
    <section aria-label="Subscription metrics" className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5">
      <Tile
        title="Monthly Recurring Rev"
        icon={<TrendingUpIcon />}
        tone="mint"
        value={usd.format(mrr)}
        delta={`+12.4% MoM (+${usd.format(mrr * 0.11)} net)`}
        deltaIcon={<ArrowUpIcon />}
        left={`Annual: ${annualShare}%`}
        right={`Monthly: ${100 - annualShare}%`}
      />
      <Tile
        title="Active Paid Subscribers"
        icon={<UsersIcon />}
        tone="blue"
        value={integer.format(subs)}
        delta="+8.2% vs last month"
        deltaIcon={<ArrowUpIcon />}
        left={`${formatCompact(Math.round(subs * 0.08))} Grace Trialists`}
        right={<span className="font-semibold text-foreground">1.38% Churn</span>}
      />
      <Tile
        title="Customer LTV & ARPU"
        icon={<CircleDollarSignIcon />}
        tone="stone"
        value={usd.format(ltv)}
        delta="+5.1% blended LTV"
        deltaIcon={<ArrowUpRightIcon />}
        left={`ARPU: $${arpu.toFixed(2)} / user`}
        right="42d Payback"
      />
      <Tile
        title="Trial-to-Paid Conversion"
        icon={<RefreshCcwDotIcon />}
        tone="lavender"
        value="44.6%"
        delta="+3.2% vs App Store avg"
        deltaIcon={<ArrowUpIcon />}
        left={`${formatCompact(Math.round(subs * 0.21))} Trials (30d)`}
        right="78% Y2 Renew"
      />
      <Tile
        title="Refund & Invol. Churn"
        icon={<HeartHandshakeIcon />}
        tone="pink"
        value="0.38%"
        delta="Optimal (Tier 1 safe)"
        deltaIcon={<CircleCheckIcon />}
        left={<span className="font-semibold text-pink">{usd.format(mrr * 0.034)} Saved</span>}
        right="412 Grace Restored"
      />
    </section>
  )
}
