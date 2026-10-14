import {
  ArrowUpRightIcon,
  BanknoteIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  StarIcon,
  ThumbsUpIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { KpiCardCompact } from "@/components/dashboard/kpi-card"
import type { AppDetail } from "@/data/app-details"
import type { PortfolioApp } from "@/data/apps"
import {
  formatCompact,
  formatCompactUsd,
  formatSignedPercent,
  integer,
} from "@/lib/format"

function Stars({ rating }: { rating: number }) {
  return (
    <span className="ml-1.5 inline-flex align-middle" aria-label={`${rating.toFixed(2)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          className={i < Math.round(rating) ? "size-3.5 fill-amber text-amber" : "size-3.5 text-amber/30"}
        />
      ))}
    </span>
  )
}

export function AppKpis({ app, detail }: { app: PortfolioApp; detail: AppDetail }) {
  const [dollars, cents] = app.revenueMonthly.toFixed(2).split(".")
  const slaLabel =
    app.crashFree >= 99.8 ? "SLA Exceeded" : app.crashFree >= 99.6 ? "SLA Met" : "Below SLA"

  return (
    <section
      aria-label="App metrics"
      className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5"
    >
      <KpiCardCompact
        title="Monthly Revenue"
        icon={<BanknoteIcon />}
        tone="mint"
        value={
          <>
            ${Number(dollars).toLocaleString("en-US")}
            <span className="text-lg font-normal text-muted-foreground">.{cents}</span>
          </>
        }
        delta={{ label: `${formatSignedPercent(app.revenueGrowth)} MoM`, icon: <TrendingUpIcon /> }}
        trend={detail.trends.revenue}
        breakdown={[
          { label: "MRR", value: formatCompactUsd(detail.mrr) },
          { label: "IAP", value: formatCompactUsd(detail.iap) },
          { label: "ARPPU", value: `$${detail.arppu.toFixed(2)}` },
        ]}
      />
      <KpiCardCompact
        title="Active Audience"
        icon={<UsersIcon />}
        tone="blue"
        value={formatCompact(app.mau)}
        unit="MAU"
        delta={{ label: app.mau ? "+12.1%" : "New", icon: <TrendingUpIcon /> }}
        trend={detail.trends.audience}
        breakdown={[
          { label: "DAU", value: formatCompact(detail.dau) },
          { label: "Ratio", value: `${(detail.stickiness * 100).toFixed(1)}%` },
          { label: "Subs", value: formatCompact(app.subscribers) },
        ]}
      />
      <KpiCardCompact
        title="Stability & Health"
        icon={<ShieldCheckIcon />}
        tone="lavender"
        value={`${app.crashFree.toFixed(2)}%`}
        delta={{ label: slaLabel, icon: <BadgeCheckIcon /> }}
        trend={detail.trends.stability}
        breakdown={[
          {
            label: "Crashes",
            value: `${formatCompact(detail.crashes)} / ${formatCompact(detail.sessions)}`,
          },
          { label: "ANR", value: `${detail.anrRate.toFixed(2)}%` },
        ]}
      />
      <KpiCardCompact
        title="Store Rating"
        icon={<StarIcon />}
        tone="amber"
        value={
          <>
            {app.rating.toFixed(2)}
            <Stars rating={app.rating} />
          </>
        }
        delta={{ label: `${formatCompact(app.ratingCount)} Reviews`, icon: <ThumbsUpIcon /> }}
        aside={`+${detail.ratingDelta.toFixed(2)} QoQ`}
        breakdown={[
          ...(detail.iosRating !== null ? [{ label: "iOS", value: `${detail.iosRating.toFixed(2)} ★` }] : []),
          ...(detail.androidRating !== null
            ? [{ label: "Android", value: `${detail.androidRating.toFixed(2)} ★` }]
            : []),
        ]}
      />
      <KpiCardCompact
        title="Paywall Conversion"
        icon={<CreditCardIcon />}
        tone="pink"
        value={`${detail.paywallConversion.toFixed(1)}%`}
        delta={{ label: `+${detail.paywallUplift.toFixed(1)}% uplift`, icon: <ArrowUpRightIcon /> }}
        aside={`Variant ${detail.paywallVariant}`}
        breakdown={[
          { label: "Weekly Trials", value: integer.format(detail.weeklyTrials) },
          { label: "Paid", value: `${detail.trialToPaid}%` },
        ]}
      />
    </section>
  )
}
