import * as React from "react"
import {
  ArrowUpDownIcon,
  CirclePlusIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  StoreIcon,
  UploadIcon,
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
import { APP_QUOTA, APPS, nextRolloutStep, type PortfolioApp } from "@/data/apps"
import { exportAppsCsv } from "@/lib/export-apps-csv"
import { cn } from "@/lib/utils"

const SORTS = {
  "mrr-desc": { label: "MRR (High to Low)", compare: (a: PortfolioApp, b: PortfolioApp) => b.revenueMonthly - a.revenueMonthly },
  "mrr-asc": { label: "MRR (Low to High)", compare: (a: PortfolioApp, b: PortfolioApp) => a.revenueMonthly - b.revenueMonthly },
  "mau-desc": { label: "Active Users", compare: (a: PortfolioApp, b: PortfolioApp) => b.mau - a.mau },
  "rating-desc": { label: "Store Rating", compare: (a: PortfolioApp, b: PortfolioApp) => b.rating - a.rating },
  "name-asc": { label: "Name (A–Z)", compare: (a: PortfolioApp, b: PortfolioApp) => a.name.localeCompare(b.name) },
} as const

type SortKey = keyof typeof SORTS
type View = "grid" | "list"

export default function AppsPage() {
  const [apps, setApps] = React.useState<PortfolioApp[]>(APPS)
  const [category, setCategory] = React.useState<string>("all")
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("mrr-desc")
  const [view, setView] = React.useState<View>("grid")

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const app of apps) counts.set(app.category, (counts.get(app.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [apps])

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps
      .filter(
        (a) =>
          (category === "all" || a.category === category) &&
          (!q || a.name.toLowerCase().includes(q) || a.bundleId.toLowerCase().includes(q))
      )
      .sort(SORTS[sort].compare)
  }, [apps, category, query, sort])

  const promote = (target: PortfolioApp) =>
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== target.id || a.status.kind !== "staged") return a
        const next = nextRolloutStep(a.status.rollout)
        return next >= 100
          ? { ...a, status: { kind: "live" }, recentlyReleased: true }
          : { ...a, status: { kind: "staged", rollout: next } }
      })
    )

  const slotsLeft = APP_QUOTA - apps.length

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @3xl/main:flex-row @3xl/main:items-start @3xl/main:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">
              Apps &amp; Portfolio Management
            </h1>
            <span className="rounded-full bg-mint-hover px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-mint uppercase">
              {apps.length} Active Apps
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor, configure, and scale mobile applications across iOS App
            Store, Google Play Store, and Web platforms. Unified release health,
            crash rates, and revenue telemetry.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 @3xl/main:justify-end">
          <Button
            variant="ghost"
            className="h-10 rounded-xl bg-neutral-strong px-4 text-[13px] font-semibold hover:bg-neutral-deep"
            onClick={() => exportAppsCsv(apps, "cipherocto-portfolio")}
          >
            <UploadIcon />
            Export Portfolio
          </Button>
          <Button variant="outline" className="h-10 rounded-xl px-4 text-[13px] font-semibold">
            <StoreIcon />
            Connect Storefront
          </Button>
          <Button className="h-10 rounded-xl px-4 text-[13px] font-semibold" disabled={slotsLeft <= 0}>
            <CirclePlusIcon className="text-mint-border" />
            Register New App
          </Button>
        </div>
      </section>

      <AppsSummary apps={apps} />

      <section aria-label="Filters" className="flex flex-col gap-3 px-4 lg:px-6 @4xl/main:flex-row @4xl/main:items-center">
        <div
          role="radiogroup"
          aria-label="Category"
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
        >
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
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground/80 shadow-[0_0_0_1px_var(--border)] hover:bg-foreground/[0.04]"
                )}
              >
                {name === "all" ? "All Apps" : name}
                <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/70" : "text-subtle-foreground")}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex h-9 w-full items-center gap-2 rounded-[10px] bg-card px-3 shadow-[0_0_0_1px_var(--border)] focus-within:ring-[3px] focus-within:ring-ring/10 sm:w-60">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search app, bundle ID…"
              aria-label="Search apps"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 rounded-[10px] px-3 text-[13px] font-semibold">
                <ArrowUpDownIcon />
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

          <div role="radiogroup" aria-label="View" className="flex rounded-[10px] bg-foreground/[0.05] p-0.5">
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
                onClick={() => setView(value)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors",
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

      <section aria-label="Applications" className="px-4 lg:px-6">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
            No apps match your filters.
          </p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            {visible.map((app) => (
              <AppCard key={app.id} app={app} onPromote={promote} />
            ))}
            <RegisterAppCard slotsLeft={slotsLeft} />
          </div>
        ) : (
          <AppsListView apps={visible} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
        <StorefrontIntegrations apps={apps} />
        <div className="min-w-0 @5xl/main:col-span-2">
          <StagedRollouts apps={apps} onPromote={promote} />
        </div>
      </div>
    </>
  )
}
