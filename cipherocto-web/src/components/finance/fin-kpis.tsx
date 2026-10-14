import * as React from "react"
import { BadgeCheckIcon, LandmarkIcon, PieChartIcon, RefreshCwIcon, ScaleIcon, TrendingUpIcon, LineChartIcon } from "lucide-react"

import { GATEWAYS, TOTALS, type MoneyFormat } from "@/data/finance"
import { cn } from "@/lib/utils"

const TONES = {
  blue: { tile: "bg-blue-surface", title: "text-tertiary", badge: "bg-blue-hover text-tertiary", pill: "bg-mint-border text-mint", sub: "text-tertiary" },
  mint: { tile: "bg-mint-surface", title: "text-mint", badge: "bg-mint-border text-mint", pill: "bg-mint-border text-mint", sub: "text-mint" },
  amber: { tile: "bg-amber-surface", title: "text-amber", badge: "bg-amber-hover text-amber", pill: "bg-amber-hover text-amber", sub: "text-amber" },
  lavender: { tile: "bg-lavender-surface", title: "text-lavender", badge: "bg-lavender-hover text-lavender", pill: "bg-lavender-hover text-lavender", sub: "text-lavender" },
  pink: { tile: "bg-pink-surface", title: "text-pink", badge: "bg-pink-hover text-pink", pill: "bg-pink-hover text-pink", sub: "text-pink" },
} as const

function Tile({
  tone,
  title,
  icon,
  value,
  pill,
  aside,
  split,
  footer,
}: {
  tone: keyof typeof TONES
  title: string
  icon: React.ReactNode
  value: string
  pill: React.ReactNode
  aside?: React.ReactNode
  split?: [React.ReactNode, React.ReactNode]
  footer?: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <article className={cn("flex min-w-0 flex-col justify-between rounded-2xl p-4 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]", t.tile)}>
      <div>
        <header className="flex items-center justify-between gap-2">
          <h3 className={cn("text-[13px] leading-[18px] font-semibold tracking-[0.01em]", t.title)}>{title}</h3>
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]", t.badge)}>{icon}</span>
        </header>
        <p className="mt-2 truncate text-[28px] leading-[38px] font-bold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap [&_svg]:size-3", t.pill)}>{pill}</span>
          {aside && <span className="text-xs whitespace-nowrap text-muted-foreground">{aside}</span>}
        </div>
        {split && (
          <div className={cn("flex flex-wrap justify-between gap-x-3 gap-y-0.5 pt-1 text-xs tabular-nums", t.sub)}>
            <span className="whitespace-nowrap">{split[0]}</span>
            <span className="whitespace-nowrap">{split[1]}</span>
          </div>
        )}
        {footer && <div className={cn("text-xs font-semibold", t.title)}>{footer}</div>}
      </div>
    </article>
  )
}

/** All figures scale with `factor` so the app selector re-bases the whole page. */
export function FinanceKpis({ factor, fmt, daysLeft }: { factor: number; fmt: MoneyFormat; daysLeft: number }) {
  const gross = TOTALS.gross * factor
  const fees = TOTALS.fees * factor
  const store = gross * TOTALS.storeShare
  const payouts = GATEWAYS.reduce((s, g) => s + g.amount, 0) * factor
  const apple = GATEWAYS[0].amount * factor
  const google = GATEWAYS[1].amount * factor
  const mrr = TOTALS.mrr * factor
  const refundsAndVat = TOTALS.refundsAndVat * factor

  return (
    <section aria-label="Financial metrics" className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5">
      <Tile
        tone="blue"
        title="Gross Volume (GPV)"
        icon={<LineChartIcon />}
        value={fmt(gross, "cents")}
        pill={
          <>
            <TrendingUpIcon />
            +16.8% MoM
          </>
        }
        aside={`${fmt(gross / 30)}/day velocity`}
        split={[`Store: ${fmt(store, "compact")}`, `Direct: ${fmt(gross - store, "compact")}`]}
      />
      <Tile
        tone="mint"
        title="Net Store Payouts"
        icon={<LandmarkIcon />}
        value={fmt(payouts, "cents")}
        pill={
          <>
            <BadgeCheckIcon />
            Ready for Treasury
          </>
        }
        split={[`Apple: ${fmt(apple, "compact")}`, `Google: ${fmt(google, "compact")}`]}
        footer={`Next clearing: Nov 7 (in ${daysLeft} days)`}
      />
      <Tile
        tone="amber"
        title="Store Fees & Cut"
        icon={<PieChartIcon />}
        value={fmt(fees, "cents")}
        pill={`Take Rate: ${((TOTALS.fees / TOTALS.gross) * 100).toFixed(2)}%`}
        aside="15% Tier Qualified"
        footer={`Saved ${fmt(TOTALS.savedYtd * factor)} YTD via Small Biz Tier`}
      />
      <Tile
        tone="lavender"
        title="MRR Waterfall"
        icon={<RefreshCwIcon />}
        value={fmt(mrr)}
        pill={`+${fmt(TOTALS.netMrr * factor)} Net MRR`}
        aside={`${fmt(mrr * 12, "compact")} ARR`}
        split={[`+${fmt(TOTALS.newMrr * factor, "compact")} New`, `-${fmt(TOTALS.churnMrr * factor, "compact")} Churn`]}
      />
      <Tile
        tone="pink"
        title="Refunds & VAT"
        icon={<ScaleIcon />}
        value={fmt(refundsAndVat, "cents")}
        pill="0.38% (Decile < 1%)"
        split={[`Refunds: ${fmt(TOTALS.refunds * factor)}`, `VAT: ${fmt(TOTALS.vat * factor)}`]}
        footer={`Disputes: ${fmt(TOTALS.disputes * factor)} (100% Won)`}
      />
    </section>
  )
}
