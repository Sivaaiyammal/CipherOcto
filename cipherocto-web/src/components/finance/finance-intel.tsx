import { Link } from "react-router-dom"
import { ArrowRightIcon, GavelIcon, PiggyBankIcon, RefreshCwIcon } from "lucide-react"

import type { MoneyFormat } from "@/data/finance"

function Row({ label, value, tone }: { label: string; value: string; tone?: "mint" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background p-2 text-[13px] text-muted-foreground">
      <span>{label}</span>
      <span className={tone === "mint" ? "text-right font-semibold text-mint" : "text-right font-semibold text-foreground"}>{value}</span>
    </div>
  )
}

export function FinanceIntel({ factor, fmt }: { factor: number; fmt: MoneyFormat }) {
  return (
    <div className="grid grid-cols-1 gap-6 @3xl/main:grid-cols-3">
      <section className="flex flex-col justify-between rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-surface text-tertiary">
              <GavelIcon className="size-5" />
            </span>
            <span className="rounded-full bg-mint-border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-mint">100% In Good Standing</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Tax &amp; Nexus Compliance</h3>
            <p className="mt-1 text-xs text-muted-foreground">Stripe Tax &amp; Avalara automated marketplace remittance</p>
          </div>
          <div className="space-y-1">
            <Row label="US Economic Nexus" value="4 States Registered" />
            <Row label="EU One-Stop-Shop (OSS)" value="Compliant & Active" tone="mint" />
            <Row label="Marketplace Facil. Withheld" value={`${fmt(18_420 * factor)} at Source`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Next Filing:</p>
          <p className="text-[13px] font-bold text-foreground">Q4 Quarterly Return — Due Jan 15, 2025</p>
        </div>
      </section>

      <section className="flex flex-col justify-between rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-mint-hover text-mint">
              <RefreshCwIcon className="size-5" />
            </span>
            <span className="rounded-full bg-mint-border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-mint">14.2x Software ROI</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Involuntary Churn Recovery</h3>
            <p className="mt-1 text-xs text-muted-foreground">Smart payment retry sequences &amp; card token refresh</p>
          </div>
          <div className="space-y-1">
            <Row label="Recovered Revenue (30D)" value={`+${fmt(4_810 * factor, "cents")}`} tone="mint" />
            <Row label="Retry Queue Grace Period" value="84 Accounts Active" />
            <Row label="Mean Recovery Time" value="2.1 Days" />
          </div>
        </div>
        <Link to="/subscriptions" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-mint hover:underline">
          Configure Smart Dunning Rules
          <ArrowRightIcon className="size-4" />
        </Link>
      </section>

      <section className="flex flex-col justify-between rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-hover text-amber">
              <PiggyBankIcon className="size-5" />
            </span>
            <span className="rounded-full bg-amber-hover px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-amber">4.85% APY Treasury</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Working Capital &amp; Forecast</h3>
            <p className="mt-1 text-xs text-muted-foreground">90-day predictive cash trajectory &amp; sweep yield</p>
          </div>
          <div className="space-y-1">
            <Row label="Nov Projected Payout" value={`${fmt(228_000 * factor)} (+4.3%)`} />
            <Row label="Dec Holiday Bump Pacing" value={`${fmt(264_000 * factor)} (+15.8%)`} tone="mint" />
            <Row label="Monthly Treasury Interest" value={`+${fmt(1_940 * factor)}/mo passive`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Total Liquidity Reserve:</p>
          <p className="text-[13px] font-bold text-foreground">{fmt(480_000 * factor)} in Silicon Valley Treasury Yield</p>
        </div>
      </section>
    </div>
  )
}
