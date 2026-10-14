import {
  ArrowUpRightIcon,
  BanknoteIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { KpiCard } from "@/components/dashboard/kpi-card"
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
    <span className="ml-1.5 inline-flex align-middle" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          className={
            i < Math.round(rating)
              ? "size-3 fill-amber text-amber"
              : "size-3 text-amber/30"
          }
        />
      ))}
    </span>
  )
}

export function AppKpis({ app, detail }: { app: PortfolioApp; detail: AppDetail }) {
  const [dollars, cents] = app.revenueMonthly.toFixed(2).split(".")

  return (
    <section
      aria-label="App metrics"
      className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5"
    >
      <KpiCard
        title="Monthly Revenue"
        icon={<BanknoteIcon />}
        tone="mint"
        value={
          <>
            ${Number(dollars).toLocaleString("en-US")}
            <span className="text-base text-muted-foreground">.{cents}</span>
          </>
        }
        delta={{ label: `${formatSignedPercent(app.revenueGrowth)} MoM`, icon: <TrendingUpIcon /> }}
        caption=""
        trend={detail.trends.revenue}
        breakdown={[
          { label: "MRR", value: formatCompactUsd(detail.mrr) },
          { label: "IAP", value: formatCompactUsd(detail.iap) },
          { label: "ARPPU", value: `$${detail.arppu.toFixed(2)}` },
        ]}
      />
      <KpiCard
        title="Active Audience"
        icon={<UsersIcon />}
        tone="indigo"
        value={formatCompact(app.mau)}
        unit="MAU"
        delta={{ label: "+12.1%", icon: <ArrowUpRightIcon /> }}
        caption="vs last month"
        trend={detail.trends.audience}
        breakdown={[
          { label: "DAU", value: formatCompact(detail.dau) },
          { label: "Ratio", value: `${(detail.stickiness * 100).toFixed(1)}%` },
          { label: "Subs", value: formatCompact(app.subscribers) },
        ]}
      />
      <KpiCard
        title="Stability & Health"
        icon={<ShieldCheckIcon />}
        tone="lavender"
        value={`${app.crashFree.toFixed(2)}%`}
        delta={{
          label: app.crashFree >= 99.8 ? "SLA Exceeded" : app.crashFree >= 99.6 ? "SLA Met" : "Below SLA",
          icon: <ShieldCheckIcon />,
        }}
        caption=""
        trend={detail.trends.stability}
        breakdown={[
          {
            label: "Crashes",
            value: `${integer.format(detail.crashes)} / ${formatCompact(detail.sessions)}`,
          },
          { label: "ANR", value: `${detail.anrRate.toFixed(2)}%` },
        ]}
      />
      <KpiCard
        title="Store Rating"
        icon={<StarIcon />}
        tone="amber"
        value={
          <>
            {app.rating.toFixed(2)}
            <Stars rating={app.rating} />
          </>
        }
        delta={{ label: `${formatCompact(app.ratingCount)} Reviews`, icon: <StarIcon /> }}
        caption={`+${detail.ratingDelta.toFixed(2)} this quarter`}
        breakdown={[
          ...(detail.iosRating !== null ? [{ label: "iOS", value: `${detail.iosRating.toFixed(2)} ★` }] : []),
          ...(detail.androidRating !== null
            ? [{ label: "Android", value: `${detail.androidRating.toFixed(2)} ★` }]
            : []),
        ]}
      >
        <div className="flex h-14 items-end gap-1" aria-hidden="true">
          {[0.04, 0.03, 0.05, 0.16, 0.72].map((share, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-2.5 rounded-full bg-amber/70" style={{ height: `${Math.max(4, share * 40)}px` }} />
              <span className="text-[10px] text-muted-foreground">{i + 1}★</span>
            </div>
          ))}
        </div>
      </KpiCard>
      <KpiCard
        title="Paywall Conversion"
        icon={<CreditCardIcon />}
        tone="pink"
        value={`${detail.paywallConversion.toFixed(1)}%`}
        delta={{ label: `+${detail.paywallUplift.toFixed(1)}% uplift`, icon: <ArrowUpRightIcon /> }}
        caption={`Variant ${detail.paywallVariant}`}
        trend={detail.trends.paywall}
        breakdown={[
          { label: "Weekly Trials", value: integer.format(detail.weeklyTrials) },
          { label: "Paid", value: `${detail.trialToPaid}%` },
        ]}
      />
    </section>
  )
}
