import * as React from "react"
import {
  AppleIcon,
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  FilterIcon,
  HourglassIcon,
  MoreVerticalIcon,
  RefreshCwIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { categoryOf, type Category, type Release, type ReleaseStatus, type Tone } from "@/data/releases"
import { cn } from "@/lib/utils"

const TONE: Record<Tone, string> = {
  mint: "bg-mint-hover text-mint",
  lavender: "bg-lavender-hover text-lavender",
  blue: "bg-blue-hover text-tertiary",
  neutral: "bg-neutral-strong text-foreground",
  amber: "bg-amber-hover text-amber",
  pink: "bg-pink-hover text-pink",
}

const STATUS: Record<ReleaseStatus, { label: string; className: string; dot: string }> = {
  rollout: { label: "Rollout Active", className: "bg-mint-border text-mint", dot: "bg-stream-mrr motion-safe:animate-pulse" },
  canary: { label: "Canary Armed", className: "bg-lavender-hover text-lavender", dot: "bg-lavender motion-safe:animate-pulse" },
  paused: { label: "Paused", className: "bg-amber-hover text-amber", dot: "bg-amber" },
  halted: { label: "Halted", className: "bg-pink-hover text-destructive", dot: "bg-destructive" },
  review: { label: "In Store Review", className: "bg-neutral-strong text-foreground", dot: "bg-muted-foreground" },
  draft: { label: "Draft Ready", className: "bg-neutral-strong text-muted-foreground", dot: "bg-muted-foreground" },
  shipped: { label: "100% Deployed", className: "bg-neutral-strong text-muted-foreground", dot: "bg-stream-mrr" },
}

const TABS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All Releases" },
  { value: "rollout", label: "Active Rollouts" },
  { value: "review", label: "Store Reviews" },
  { value: "draft", label: "Drafts & Staging" },
  { value: "shipped", label: "Archived / Shipped" },
]

const PAGE_SIZE = 5

function Progress({ r }: { r: Release }) {
  const label =
    r.status === "review"
      ? "Waiting Review"
      : r.status === "draft"
        ? "Staged Sandbox"
        : r.status === "shipped"
          ? "100% Deployed"
          : r.status === "canary"
            ? `${r.pct}% (Canary)`
            : r.status === "halted"
              ? `${r.pct}% (Halted)`
              : `${r.pct}% (Day ${r.pct <= 1 ? 1 : r.pct <= 20 ? 2 : r.pct <= 50 ? 3 : r.pct <= 75 ? 4 : 5})`
  const users =
    r.status === "review" ? "0% Deployed" : r.status === "draft" ? "CI Passed" : `${((r.audience * r.pct) / 100 / 1000).toFixed(r.pct === 100 ? 2 : 1).replace(/\.00$/, "")}k users`
  const bar = r.status === "canary" ? "bg-lavender" : r.status === "halted" ? "bg-destructive" : r.status === "paused" ? "bg-amber" : r.status === "draft" ? "bg-neutral-deep" : "bg-mint"
  const width = r.status === "draft" ? 100 : r.pct
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={cn("font-semibold whitespace-nowrap", r.status === "shipped" || r.status === "rollout" ? "text-mint" : r.status === "canary" ? "text-lavender" : "text-muted-foreground")}>{label}</span>
        <span className="font-mono whitespace-nowrap text-muted-foreground">{users}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
        <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export function ReleaseTable({
  releases,
  onInspect,
  onLogs,
  onAdvance,
  onSubmit,
}: {
  releases: Release[]
  onInspect: (r: Release) => void
  onLogs: (r: Release) => void
  onAdvance: (r: Release) => void
  onSubmit: (r: Release) => void
}) {
  const [tab, setTab] = React.useState<Category | "all">("all")
  const [query, setQuery] = React.useState("")
  const [app, setApp] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const apps = [...new Set(releases.map((r) => r.app))]
  const q = query.trim().toLowerCase()
  const filtered = releases.filter(
    (r) =>
      (tab === "all" || categoryOf(r.status) === tab) &&
      (app === "all" || r.app === app) &&
      (!q || [r.version, r.commit, r.app, String(r.build)].some((s) => s.toLowerCase().includes(q)))
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const reset = () => setPage(1)
  const countFor = (v: Category | "all") => (v === "all" ? releases.length : releases.filter((r) => categoryOf(r.status) === v).length)

  return (
    <section className="mx-4 flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-1)] lg:mx-6">
      <div className="flex flex-col justify-between gap-3 p-6 @7xl/main:flex-row @7xl/main:items-center">
        <div role="radiogroup" aria-label="Release category" className="flex max-w-full overflow-x-auto rounded-xl bg-foreground/[0.05] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={tab === t.value}
              onClick={() => {
                setTab(t.value)
                reset()
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all",
                tab === t.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label} ({countFor(t.value)})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex h-9 w-full items-center sm:w-64">
            <SearchIcon className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                reset()
              }}
              placeholder="Filter version or commit…"
              aria-label="Filter releases"
              className="h-9 w-full rounded-lg bg-background pr-3 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-foreground/[0.05]"
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-background px-3 text-[13px] font-semibold hover:bg-foreground/[0.06]">
                <FilterIcon className="size-4" />
                {app === "all" ? "Filter Apps" : app}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>App</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={app}
                onValueChange={(v) => {
                  setApp(v)
                  reset()
                }}
              >
                <DropdownMenuRadioItem value="all">All apps</DropdownMenuRadioItem>
                {apps.map((a) => (
                  <DropdownMenuRadioItem key={a} value={a}>
                    {a}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="px-3 py-3">App &amp; Version</th>
              <th className="px-3 py-3">Platform &amp; Track</th>
              <th className="px-3 py-3">Rollout Progress</th>
              <th className="px-3 py-3">Telemetry &amp; Health</th>
              <th className="hidden px-3 py-3 @7xl/main:table-cell">Release Highlights</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((r) => {
              const st = STATUS[r.status]
              const healthy = r.status !== "halted"
              return (
                <tr key={r.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold", TONE[r.tone])}>{r.initials}</span>
                      <div>
                        <p className="font-semibold whitespace-nowrap text-foreground">{r.app}</p>
                        <p className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {r.version} ({r.build}) • #{r.commit}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs whitespace-nowrap">
                      {r.platform === "ios" ? <AppleIcon className="size-3.5" /> : r.platform === "android" ? <SmartphoneIcon className="size-3.5" /> : <ArrowRightLeftIcon className="size-3.5" />}
                      {r.track}
                    </span>
                  </td>
                  <td className="w-48 px-3 py-4">
                    <Progress r={r} />
                  </td>
                  <td className="px-3 py-4">
                    <p className={cn("flex items-center gap-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", healthy ? "text-mint" : "text-destructive")}>
                      {r.status === "review" ? <HourglassIcon className="size-3.5" /> : <CheckCircle2Icon className="size-3.5" />}
                      {r.crash}
                    </p>
                    <p className="text-[11px] whitespace-nowrap text-muted-foreground">{r.note}</p>
                    <span className="mt-1.5 flex flex-wrap gap-1 @7xl/main:hidden">
                      {r.highlights.map((h) => (
                        <span key={h} className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                          {h}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="hidden px-3 py-4 @7xl/main:table-cell">
                    <span className="flex max-w-xs flex-wrap gap-1">
                      {r.highlights.map((h) => (
                        <span key={h} className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                          {h}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", st.className)}>
                      <span className={cn("size-1.5 rounded-full", st.dot)} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1">
                      <button type="button" title="Inspect Build" aria-label={`Inspect ${r.app} ${r.version}`} onClick={() => onInspect(r)} className="rounded-md p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                        <ShieldCheckIcon className="size-[18px]" />
                      </button>
                      <button type="button" title="View Logs" aria-label={`Logs for ${r.app} ${r.version}`} onClick={() => onLogs(r)} className="rounded-md p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                        <ScrollTextIcon className="size-[18px]" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" aria-label={`More actions for ${r.app} ${r.version}`} className="rounded-md p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                            <MoreVerticalIcon className="size-[18px]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onInspect(r)}>Inspect build</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onLogs(r)}>View logs</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {r.status === "draft" && <DropdownMenuItem onSelect={() => onSubmit(r)}>Submit for store review</DropdownMenuItem>}
                          {r.status === "review" && <DropdownMenuItem onSelect={() => onAdvance(r)}>Mark approved &amp; start rollout</DropdownMenuItem>}
                          {(r.status === "rollout" || r.status === "canary") && <DropdownMenuItem onSelect={() => onAdvance(r)}>Promote to next stage</DropdownMenuItem>}
                          {(r.status === "shipped" || r.status === "halted" || r.status === "paused") && (
                            <DropdownMenuItem disabled>
                              <RefreshCwIcon /> No actions available
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No releases match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col justify-between gap-2 bg-background px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          Showing <strong>{visible.length}</strong> of <strong>{filtered.length}</strong> recorded releases across 8 active production apps
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded bg-card px-2.5 py-1 text-foreground shadow-[var(--shadow-1)] disabled:opacity-50">
            Previous
          </button>
          <span className="font-semibold text-foreground">
            Page {current} of {pageCount}
          </span>
          <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)} className="rounded bg-card px-2.5 py-1 text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.05] disabled:opacity-50">
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}
