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
  NO_VALUE,
  orDash,
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
  const [dollars, cents] = (app.revenueMonthly ?? 0).toFixed(2).split(".")
  const slaLabel =
    app.crashFree === null
      ? NO_VALUE
      : app.crashFree >= 99.8
        ? "SLA Exceeded"
        : app.crashFree >= 99.6
          ? "SLA Met"
          : "Below SLA"
  // A sparkline needs at least two points; otherwise the card shows its aside text.
  const spark = (points: number[]) => (points.length > 1 ? points : undefined)
  const usdOrDash = (n: number | null) => orDash(n, formatCompactUsd)
  const NOT_CONNECTED = "Not connected"

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
          app.revenueMonthly === null ? (
            NO_VALUE
          ) : (
            <>
              ${Number(dollars).toLocaleString("en-US")}
              <span className="text-lg font-normal text-muted-foreground">.{cents}</span>
            </>
          )
        }
        delta={{
          label: app.revenueGrowth === null ? NO_VALUE : `${formatSignedPercent(app.revenueGrowth)} MoM`,
          icon: <TrendingUpIcon />,
        }}
        trend={spark(detail.trends.revenue)}
        aside={NOT_CONNECTED}
        breakdown={[
          { label: "MRR", value: usdOrDash(detail.mrr) },
          { label: "IAP", value: usdOrDash(detail.iap) },
          { label: "ARPPU", value: orDash(detail.arppu, (n) => `$${n.toFixed(2)}`) },
        ]}
      />
      <KpiCardCompact
        title="Active Audience"
        icon={<UsersIcon />}
        tone="blue"
        value={orDash(app.mau, formatCompact)}
        unit="MAU"
        delta={{ label: NO_VALUE, icon: <TrendingUpIcon /> }}
        trend={spark(detail.trends.audience)}
        aside={NOT_CONNECTED}
        breakdown={[
          { label: "DAU", value: orDash(detail.dau, formatCompact) },
          { label: "Ratio", value: orDash(detail.stickiness, (n) => `${(n * 100).toFixed(1)}%`) },
          { label: "Subs", value: orDash(app.subscribers, formatCompact) },
        ]}
      />
      <KpiCardCompact
        title="Stability & Health"
        icon={<ShieldCheckIcon />}
        tone="lavender"
        value={orDash(app.crashFree, (n) => `${n.toFixed(2)}%`)}
        delta={{ label: slaLabel, icon: <BadgeCheckIcon /> }}
        trend={spark(detail.trends.stability)}
        aside={NOT_CONNECTED}
        breakdown={[
          {
            label: "Crashes",
            value:
              detail.crashes === null || detail.sessions === null
                ? NO_VALUE
                : `${formatCompact(detail.crashes)} / ${formatCompact(detail.sessions)}`,
          },
          { label: "ANR", value: orDash(detail.anrRate, (n) => `${n.toFixed(2)}%`) },
        ]}
      />
      <KpiCardCompact
        title="Store Rating"
        icon={<StarIcon />}
        tone="amber"
        value={
          app.rating === null ? (
            NO_VALUE
          ) : (
            <>
              {app.rating.toFixed(2)}
              <Stars rating={app.rating} />
            </>
          )
        }
        delta={{
          label: app.ratingCount === null ? NO_VALUE : `${formatCompact(app.ratingCount)} Reviews`,
          icon: <ThumbsUpIcon />,
        }}
        aside={detail.ratingDelta === null ? NOT_CONNECTED : `+${detail.ratingDelta.toFixed(2)} QoQ`}
        breakdown={[
          ...(detail.iosRating !== null ? [{ label: "iOS", value: `${detail.iosRating.toFixed(2)} ★` }] : []),
          ...(detail.androidRating !== null
            ? [{ label: "Android", value: `${detail.androidRating.toFixed(2)} ★` }]
            : []),
          ...(detail.iosRating === null && detail.androidRating === null
            ? [{ label: "Play Store", value: NO_VALUE }]
            : []),
        ]}
      />
      <KpiCardCompact
        title="Paywall Conversion"
        icon={<CreditCardIcon />}
        tone="pink"
        value={orDash(detail.paywallConversion, (n) => `${n.toFixed(1)}%`)}
        delta={{
          label: detail.paywallUplift === null ? NO_VALUE : `+${detail.paywallUplift.toFixed(1)}% uplift`,
          icon: <ArrowUpRightIcon />,
        }}
        aside={detail.paywallVariant === null ? NOT_CONNECTED : `Variant ${detail.paywallVariant}`}
        breakdown={[
          { label: "Weekly Trials", value: orDash(detail.weeklyTrials, (n) => integer.format(n)) },
          { label: "Paid", value: orDash(detail.trialToPaid, (n) => `${n}%`) },
        ]}
      />
    </section>
  )
}
