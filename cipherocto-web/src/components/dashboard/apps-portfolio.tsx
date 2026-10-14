import * as React from "react"
import { Link } from "react-router-dom"
import { ArchiveIcon, DownloadIcon, EllipsisVerticalIcon, PencilIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  APP_TONE_TILE,
  releaseStatusLabel,
  type Platform,
  type ReleaseStatus,
} from "@/data/apps"
import { useApps } from "@/data/apps-context"
import { exportAppsCsv } from "@/lib/export-apps-csv"
import { integer as number, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 4

const PLATFORM_FILTERS: { value: Platform | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
]

function StatusPill({ status }: { status: ReleaseStatus }) {
  const tone = {
    live: "bg-mint-hover text-mint [--dot:var(--mint)]",
    review: "bg-neutral-strong text-foreground/80 [--dot:var(--foreground)]",
    staged: "bg-blue-hover text-tertiary [--dot:var(--tertiary)]",
  }[status.kind]

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold whitespace-nowrap",
        tone
      )}
    >
      <span className="size-1.5 rounded-full bg-(--dot)" />
      {releaseStatusLabel(status)}
    </span>
  )
}

export function AppsPortfolio() {
  const { apps: APPS } = useApps()
  const [query, setQuery] = React.useState("")
  const [platform, setPlatform] = React.useState<Platform | "all">("all")
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return APPS.filter(
      (a) =>
        (platform === "all" || a.platforms.includes(platform)) &&
        (!q ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q))
    )
  }, [APPS, query, platform])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-1)]">
      <header className="flex flex-col gap-4 p-5 lg:px-6 @3xl/main:flex-row @3xl/main:items-center @3xl/main:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
              Apps Portfolio Performance
            </h2>
            <span className="rounded-full bg-mint-hover px-2 py-0.5 text-[11px] font-bold text-mint">
              {APPS.length} Active
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Real-time sync from App Store Connect &amp; Google Play Console.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 w-full items-center gap-2 rounded-[10px] bg-foreground/[0.04] px-3 focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/10 sm:w-56">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Filter apps…"
              aria-label="Filter apps"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div
            role="radiogroup"
            aria-label="Platform"
            className="flex rounded-[10px] bg-foreground/[0.05] p-0.5"
          >
            {PLATFORM_FILTERS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={platform === p.value}
                onClick={() => {
                  setPlatform(p.value)
                  setPage(1)
                }}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-semibold transition-colors",
                  platform === p.value
                    ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="h-9 rounded-[10px] px-3 text-[13px] font-semibold"
            onClick={() => exportAppsCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <DownloadIcon />
            Export CSV
          </Button>
        </div>
      </header>

      <Table className="min-w-[900px]">
        <TableHeader className="bg-background">
          <TableRow className="hover:bg-transparent">
            {[
              ["App Name & Build", "pl-5 lg:pl-6"],
              ["Category", ""],
              ["Installs (30D)", "text-right"],
              ["Revenue", "text-right"],
              ["Subscribers", "text-right"],
              ["Release Status", "pl-6"],
              ["Quick Actions", "pr-5 text-right lg:pr-6"],
            ].map(([label, cls], i) => (
              <TableHead
                key={i}
                className={cn(
                  "h-11 text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase",
                  cls
                )}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((app) => {
            const Icon = app.icon
            return (
              <TableRow key={app.id} className="h-16 hover:bg-[#f8fafc]">
                <TableCell className="pl-5 lg:pl-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5.5",
                        APP_TONE_TILE[app.tone]
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="leading-tight">
                      <Link
                        to={`/apps/${app.id}`}
                        className="text-[13px] font-bold text-foreground hover:underline"
                      >
                        {app.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        v{app.version} • Build {app.build}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {app.category}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold text-foreground">
                  {number.format(app.installs30d)}
                </TableCell>
                <TableCell className="text-right text-sm whitespace-nowrap">
                  <span className="font-bold text-foreground">
                    {usd.format(app.revenueMonthly)}
                  </span>{" "}
                  <span className="text-xs text-muted-foreground">/mo</span>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold text-foreground">
                  {number.format(app.subscribers)}
                </TableCell>
                <TableCell className="pl-6">
                  <StatusPill status={app.status} />
                </TableCell>
                <TableCell className="pr-5 text-right lg:pr-6">
                  <div className="inline-flex items-center justify-end gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg bg-foreground/[0.04] px-2.5 text-xs font-semibold hover:bg-foreground/[0.08]"
                    >
                      <Link to={`/remote-config?app=${app.id}`}>Config</Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg bg-foreground/[0.04] px-2.5 text-xs font-semibold hover:bg-foreground/[0.08]"
                    >
                      <Link to={`/apps/${app.id}`}>Analytics</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                          aria-label={`More actions for ${app.name}`}
                        >
                          <EllipsisVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/apps/${app.id}`}>Open app console</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PencilIcon />
                          Edit store listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                          <ArchiveIcon />
                          Archive app
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {visible.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={7}
                className="h-24 text-center text-sm text-subtle-foreground"
              >
                No apps match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <footer className="flex flex-col gap-3 bg-foreground/[0.025] px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="tabular-nums">
          {filtered.length === 0 ? (
            "No applications"
          ) : (
            <>
              Showing{" "}
              <strong className="font-semibold text-foreground">
                {start + 1} to {start + visible.length}
              </strong>{" "}
              of {filtered.length} active applications
            </>
          )}
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg bg-card px-3 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-foreground/[0.06]"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? "default" : "ghost"}
              size="sm"
              aria-current={n === currentPage ? "page" : undefined}
              className={cn(
                "size-8 rounded-lg p-0 text-xs font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
                n !== currentPage && "bg-card hover:bg-foreground/[0.06]"
              )}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg bg-card px-3 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-foreground/[0.06]"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </nav>
      </footer>
    </section>
  )
}
