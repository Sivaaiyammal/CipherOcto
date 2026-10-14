import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { ArrowLeftRightIcon, ChevronDownIcon, DownloadIcon } from "lucide-react"

import { AnalyticsKpis } from "@/components/analytics/analytics-kpis"
import { CohortHeatmap } from "@/components/analytics/cohort-heatmap"
import { CompareCohortsSheet } from "@/components/analytics/compare-cohorts-sheet"
import { ChurnDiagnostics, LivePulse, SessionEngagement } from "@/components/analytics/deep-dive"
import { PaywallFunnel } from "@/components/analytics/paywall-funnel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApps } from "@/data/apps-context"
import { BASE, DAYS, FUNNEL, MONTHLY_COHORTS, PLATFORM_SHARE, type PlatformFilter } from "@/data/analytics"
import { downloadFile, toCsv } from "@/lib/download"
import { cn } from "@/lib/utils"

const PLATFORMS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
]

const triggerBtn =
  "flex h-10 items-center gap-2 rounded-xl bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"

export default function AnalyticsPage() {
  const { apps } = useApps()
  const [searchParams, setSearchParams] = useSearchParams()
  const appParam = searchParams.get("app")
  const scope = appParam && apps.some((a) => a.id === appParam) ? appParam : "all"
  const setScope = (v: string) =>
    setSearchParams(
      (p) => {
        if (v === "all") p.delete("app")
        else p.set("app", v)
        return p
      },
      { replace: true }
    )

  const [platform, setPlatform] = React.useState<PlatformFilter>("all")
  const [compareOpen, setCompareOpen] = React.useState(false)

  const scopeApp = apps.find((a) => a.id === scope)
  const totalMau = apps.reduce((s, a) => s + a.mau, 0)
  const appShare = scopeApp && totalMau ? scopeApp.mau / totalMau : 1
  const factor = appShare * PLATFORM_SHARE[platform]
  const liveApps = scopeApp ? 1 : apps.length

  const exportCsv = () =>
    downloadFile(
      `analytics-${scope}-${platform}.csv`,
      toCsv([
        ["Metric", "Value"],
        ["MAU", Math.round(BASE.mau * factor)],
        ["DAU", Math.round(BASE.dau * factor)],
        ["Sessions (30d)", Math.round(BASE.sessions * factor)],
        [],
        ["Funnel step", "Users"],
        ...FUNNEL.map((s) => [s.label, Math.round(s.count * factor)]),
        [],
        ["Cohort", "Users", ...DAYS.map((d) => `Day ${d} %`)],
        ...MONTHLY_COHORTS.map((c) => [c.label, Math.round(c.users * factor), ...c.all.map((v) => (v == null ? "" : v))]),
      ])
    )

  const exportJson = () =>
    downloadFile(
      `analytics-${scope}-${platform}.json`,
      JSON.stringify(
        {
          scope,
          platform,
          mau: Math.round(BASE.mau * factor),
          dau: Math.round(BASE.dau * factor),
          funnel: FUNNEL.map((s) => ({ step: s.key, users: Math.round(s.count * factor) })),
          cohorts: MONTHLY_COHORTS.map((c) => ({ cohort: c.label, users: Math.round(c.users * factor), retention: Object.fromEntries(DAYS.map((d, i) => [`d${d}`, c.all[i]])) })),
        },
        null,
        2
      ),
      "application/json"
    )

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Analytics &amp; Product Intelligence</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Real-time telemetry, retention cohorts, LTV forecasting, and monetization funnels across your active apps.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={triggerBtn}>
                <span className="size-2 rounded-full bg-stream-mrr" />
                {scopeApp ? scopeApp.name : `All Apps (${apps.length} active)`}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>App scope</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={scope} onValueChange={setScope}>
                <DropdownMenuRadioItem value="all">All apps</DropdownMenuRadioItem>
                {apps.map((a) => (
                  <DropdownMenuRadioItem key={a.id} value={a.id}>
                    {a.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div role="radiogroup" aria-label="Platform" className="flex h-10 items-center rounded-xl bg-foreground/[0.05] p-1">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={platform === p.value}
                onClick={() => setPlatform(p.value)}
                className={cn(
                  "h-8 rounded-lg px-3 text-[11px] font-bold tracking-[0.04em]",
                  platform === p.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => setCompareOpen(true)} className="flex h-10 items-center gap-1.5 rounded-xl bg-neutral-strong px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-neutral-deep">
            <ArrowLeftRightIcon className="size-4" />
            Compare Cohorts
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90">
                <DownloadIcon className="size-4" />
                Export CSV / Parquet
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportCsv}>CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={exportJson}>JSON</DropdownMenuItem>
              <DropdownMenuItem disabled>Parquet — needs a warehouse connection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <AnalyticsKpis factor={factor} />

      <div className="grid grid-cols-1 items-start gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="min-w-0 @5xl/main:col-span-7">
          <CohortHeatmap factor={factor} />
        </div>
        <div className="min-w-0 @5xl/main:col-span-5">
          <PaywallFunnel factor={factor} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @3xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        <LivePulse factor={factor} appCount={liveApps} />
        <SessionEngagement factor={factor} />
        <ChurnDiagnostics factor={factor} />
      </div>

      <CompareCohortsSheet open={compareOpen} onOpenChange={setCompareOpen} />
    </>
  )
}
