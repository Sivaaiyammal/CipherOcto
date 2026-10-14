import * as React from "react"
import { Link } from "react-router-dom"
import {
  ArrowRightLeftIcon,
  ArrowUpDownIcon,
  CircleArrowDownIcon,
  CirclePlusIcon,
  LayoutGridIcon,
  ListIcon,
  PlayIcon,
  SearchIcon,
  SmartphoneIcon,
} from "lucide-react"

import { AppCard } from "@/components/apps/app-card"
import { AppsListView } from "@/components/apps/apps-list-view"
import { AppsSummary } from "@/components/apps/apps-summary"
import { RegisterAppCard } from "@/components/apps/register-app-card"
import { StagedRollouts } from "@/components/apps/staged-rollouts"
import { StorefrontIntegrations } from "@/components/apps/storefront-integrations"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAppDetail } from "@/data/app-details"
import { getCatalog } from "@/data/app-insights"
import { APP_QUOTA, type PortfolioApp, type ReleaseStatus } from "@/data/apps"
import { useApps } from "@/data/apps-context"
import { exportAppsCsv } from "@/lib/export-apps-csv"
import { cn } from "@/lib/utils"

const SORTS = {
  "mrr-desc": { label: "MRR (High to Low)", compare: (a: PortfolioApp, b: PortfolioApp) => b.revenueMonthly - a.revenueMonthly },
  "mrr-asc": { label: "MRR (Low to High)", compare: (a: PortfolioApp, b: PortfolioApp) => a.revenueMonthly - b.revenueMonthly },
  "mau-desc": { label: "Active Users", compare: (a: PortfolioApp, b: PortfolioApp) => b.mau - a.mau },
  "rating-desc": { label: "Store Rating", compare: (a: PortfolioApp, b: PortfolioApp) => b.rating - a.rating },
  "name-asc": { label: "Name (A–Z)", compare: (a: PortfolioApp, b: PortfolioApp) => a.name.localeCompare(b.name) },
} as const

const STATUS_FILTERS: { kind: ReleaseStatus["kind"]; label: string; className: string }[] = [
  { kind: "live", label: "Live Prod", className: "text-mint" },
  { kind: "staged", label: "Staged Rollout", className: "text-tertiary" },
  { kind: "review", label: "In Review", className: "text-foreground/70" },
]

type SortKey = keyof typeof SORTS
type View = "grid" | "list"

const chip =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors"

export default function AppsPage() {
  const { apps, promote: promoteApp } = useApps()
  const [category, setCategory] = React.useState<string>("all")
  const [status, setStatus] = React.useState<ReleaseStatus["kind"] | null>(null)
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("mrr-desc")
  const [view, setView] = React.useState<View>("grid")

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const app of apps) counts.set(app.category, (counts.get(app.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [apps])

  // Search also matches catalog SKU ids (e.g. "sub_annual")
  const skuIndex = React.useMemo(
    () =>
      new Map(
        apps.map((a) => [a.id, getCatalog(a, getAppDetail(a)).map((s) => s.id.toLowerCase())])
      ),
    [apps]
  )

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps
      .filter(
        (a) =>
          (category === "all" || a.category === category) &&
          (!status || a.status.kind === status) &&
          (!q ||
            a.name.toLowerCase().includes(q) ||
            a.bundleId.toLowerCase().includes(q) ||
            skuIndex.get(a.id)?.some((sku) => sku.includes(q)))
      )
      .sort(SORTS[sort].compare)
  }, [apps, category, status, query, sort, skuIndex])

  const promote = (app: PortfolioApp) => promoteApp(app.id)
  const slotsLeft = APP_QUOTA - apps.length

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @4xl/main:flex-row @4xl/main:items-end @4xl/main:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">
              Apps &amp; Portfolio Management
            </h1>
            <span className="hidden items-center gap-1.5 rounded-full bg-mint-hover px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-mint uppercase sm:inline-flex">
              <span className="size-1.5 rounded-full bg-mint motion-safe:animate-pulse" />
              {apps.length} Active Apps
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Monitor, configure, and scale mobile applications across iOS App
            Store, Google Play Store, and Web platforms. Unified release health,
            crash rates, and revenue telemetry.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            className="h-10 rounded-xl bg-foreground/[0.05] px-3.5 text-[13px] font-semibold shadow-[var(--shadow-1)] hover:bg-foreground/[0.09]"
            onClick={() => exportAppsCsv(apps, "cipherocto-portfolio")}
          >
            <CircleArrowDownIcon className="text-muted-foreground" />
            Export Portfolio
          </Button>
          <Button
            variant="ghost"
            className="h-10 rounded-xl bg-card px-3.5 text-[13px] font-semibold shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
          >
            <ArrowRightLeftIcon className="text-mint" />
            Connect Storefront
            <span className="flex -space-x-1 pl-0.5" aria-hidden="true">
              <span className="flex size-4 items-center justify-center rounded-full bg-neutral-strong ring-1 ring-card">
                <SmartphoneIcon className="size-2.5" />
              </span>
              <span className="flex size-4 items-center justify-center rounded-full bg-neutral-strong text-mint ring-1 ring-card">
                <PlayIcon className="size-2.5" />
              </span>
            </span>
          </Button>
          <Button
            asChild={slotsLeft > 0}
            className="h-10 rounded-xl px-4 text-[13px] font-semibold shadow-[var(--shadow-2)] active:scale-[0.98]"
            disabled={slotsLeft <= 0}
          >
            {slotsLeft > 0 ? (
              <Link to="/apps/new">
                <CirclePlusIcon />
                Register New App
              </Link>
            ) : (
              <>
                <CirclePlusIcon />
                Register New App
              </>
            )}
          </Button>
        </div>
      </section>

      <AppsSummary apps={apps} />

      <div className="px-4 lg:px-6">
        <section
          aria-label="Filters"
          className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-2 shadow-[var(--shadow-1)] @7xl/main:flex-row @7xl/main:items-center @7xl/main:justify-between"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
              {[["all", apps.length] as const, ...categories].map(([name, count]) => {
                const active = category === name
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCategory(name)}
                    className={cn(
                      chip,
                      active
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]"
                        : "bg-foreground/[0.04] font-medium text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground"
                    )}
                  >
                    {name === "all" ? "All Apps" : name}
                    <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "opacity-60")}>{count}</span>
                  </button>
                )
              })}
            </div>

            <span className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden="true" />

            <div role="group" aria-label="Release status" className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => {
                const count = apps.filter((a) => a.status.kind === s.kind).length
                if (count === 0) return null
                const active = status === s.kind
                return (
                  <button
                    key={s.kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(active ? null : s.kind)}
                    className={cn(
                      chip,
                      s.className,
                      active
                        ? "bg-card shadow-[0_0_0_1.5px_currentColor]"
                        : "bg-foreground/[0.04] hover:bg-foreground/[0.08]"
                    )}
                  >
                    {s.label}
                    <span className="text-xs font-bold tabular-nums">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 @7xl/main:justify-end">
            <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-xl bg-foreground/[0.04] px-3 transition-colors focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/10 sm:w-64 sm:flex-none">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search app, bundle ID, SKU…"
                aria-label="Search apps"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden h-8 rounded-xl bg-foreground/[0.04] px-3 text-[13px] font-semibold hover:bg-foreground/[0.08] sm:inline-flex"
                >
                  <ArrowUpDownIcon className="text-muted-foreground" />
                  {SORTS[sort].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  {Object.entries(SORTS).map(([key, s]) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div role="radiogroup" aria-label="View" className="flex rounded-xl bg-foreground/[0.04] p-1">
              {(
                [
                  ["grid", LayoutGridIcon, "Grid view"],
                  ["list", ListIcon, "List view"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={view === value}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(value)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-colors",
                    view === value
                      ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section aria-label="Applications" className="px-4 lg:px-6">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
            No apps match your filters.
          </p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            {visible.map((app) => (
              <AppCard key={app.id} app={app} onPromote={promote} />
            ))}
            <RegisterAppCard slotsLeft={slotsLeft} />
          </div>
        ) : (
          <AppsListView apps={visible} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="min-w-0 @5xl/main:col-span-5">
          <StorefrontIntegrations apps={apps} />
        </div>
        <div className="min-w-0 @5xl/main:col-span-7">
          <StagedRollouts apps={apps} onPromote={promote} />
        </div>
      </div>
    </>
  )
}
