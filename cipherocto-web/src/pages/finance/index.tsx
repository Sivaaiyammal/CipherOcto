import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronDownIcon, DownloadIcon, ReceiptTextIcon } from "lucide-react"

import { AppPerformance } from "@/components/finance/app-performance"
import { FinanceIntel } from "@/components/finance/finance-intel"
import { FinanceKpis } from "@/components/finance/fin-kpis"
import { GatewayPayouts } from "@/components/finance/gateway-payouts"
import { RevenueWaterfall } from "@/components/finance/revenue-waterfall"
import { TaxPackSheet } from "@/components/finance/tax-pack-sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  APP_FINANCE,
  CURRENCIES,
  GATEWAYS,
  makeMoney,
  net,
  TOTALS,
  WATERFALL,
  type AppFinanceRow,
  type Currency,
  type Period,
} from "@/data/finance"
import { downloadFile, toCsv } from "@/lib/download"

const triggerBtn =
  "flex h-10 items-center gap-2 rounded-xl bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"

export default function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appParam = searchParams.get("app")
  const scope = APP_FINANCE.some((r) => r.appId === appParam) ? (appParam as string) : "all"
  const setScope = (v: string) =>
    setSearchParams(
      (p) => {
        if (v === "all") p.delete("app")
        else p.set("app", v)
        return p
      },
      { replace: true }
    )

  const [currency, setCurrency] = React.useState<Currency>("USD")
  const [period, setPeriod] = React.useState<Period>("monthly")
  const [taxOpen, setTaxOpen] = React.useState(false)

  const fmt = React.useMemo(() => makeMoney(currency), [currency])
  const scopeRow = APP_FINANCE.find((r) => r.appId === scope)
  const factor = scopeRow ? scopeRow.gross / TOTALS.gross : 1
  const bars = React.useMemo(
    () => WATERFALL[period].map((b) => ({ ...b, gross: b.gross * factor, cut: b.cut * factor, refunds: b.refunds * factor, net: b.net * factor })),
    [period, factor]
  )

  const exportTable = (rows: AppFinanceRow[]) =>
    downloadFile(
      `app-unit-economics-${scope}.csv`,
      toCsv([
        ["App", "SKU", "Platforms", "Gross (USD)", "Store fee", "Refunds", "Infra & AI", "Net contribution", "Margin %", "LTV:CAC", "Status"],
        ...rows.map((r) => [
          r.name,
          r.sku,
          r.platformsLabel,
          r.gross,
          r.fee,
          r.refunds,
          r.infra,
          net(r).toFixed(2),
          ((net(r) / r.gross) * 100).toFixed(1),
          r.ltvCac,
          r.status,
        ]),
      ])
    )

  const exportFinancial = () =>
    downloadFile(
      `financial-ledger-${scope}-${period}.csv`,
      toCsv([
        ["Section", "Label", "Gross (USD)", "Store cut", "Refunds & tax", "Net"],
        ...bars.map((b) => ["Waterfall", b.label, b.gross.toFixed(2), b.cut.toFixed(2), b.refunds.toFixed(2), b.net.toFixed(2)]),
        ["Section", "Gateway", "Amount (USD)", "Status"],
        ...GATEWAYS.map((g) => ["Payouts", g.name, (g.amount * factor).toFixed(2), g.badge]),
      ])
    )

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-center @7xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Revenue &amp; Finance</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-mint-border px-3 py-1 text-[11px] font-bold tracking-[0.04em] text-mint">
              <span className="size-2 rounded-full bg-stream-mrr motion-safe:animate-pulse" />
              Financial Ledger: Reconciled &amp; Audited (GAAP/IFRS)
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Consolidated financial telemetry, store platform payout reconciliation, recurring revenue waterfalls, and tax &amp; commission
            accounting.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={triggerBtn}>
                <span className="text-mint">{CURRENCIES[currency].symbol}</span>
                {CURRENCIES[currency].label}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Reporting currency</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                  <DropdownMenuRadioItem key={c} value={c}>
                    {CURRENCIES[c].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={triggerBtn}>
                {scopeRow ? scopeRow.name : "All Stores & Apps (8 Active)"}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>App scope</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={scope} onValueChange={setScope}>
                <DropdownMenuRadioItem value="all">All Stores &amp; Apps</DropdownMenuRadioItem>
                {APP_FINANCE.map((r) => (
                  <DropdownMenuRadioItem key={r.appId} value={r.appId}>
                    {r.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => setTaxOpen(true)} className={triggerBtn}>
            <ReceiptTextIcon className="size-4 text-muted-foreground" />
            1099-K / Tax Pack
          </button>
          <button
            type="button"
            onClick={exportFinancial}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90"
          >
            <DownloadIcon className="size-4" />
            Export Financial CSV
          </button>
        </div>
      </section>

      <FinanceKpis factor={factor} fmt={fmt} daysLeft={3} />

      <div className="grid grid-cols-1 items-stretch gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="min-w-0 @5xl/main:col-span-8">
          <RevenueWaterfall period={period} onPeriod={setPeriod} bars={bars} fmt={fmt} />
        </div>
        <div className="min-w-0 @5xl/main:col-span-4">
          <GatewayPayouts factor={factor} fmt={fmt} />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <AppPerformance scope={scope} fmt={fmt} onExport={exportTable} />
      </div>

      <div className="px-4 lg:px-6">
        <FinanceIntel factor={factor} fmt={fmt} />
      </div>

      <TaxPackSheet open={taxOpen} onOpenChange={setTaxOpen} fmt={fmt} factor={factor} />
    </>
  )
}
