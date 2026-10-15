import { Link } from "react-router-dom"
import { ArrowRightIcon, HistoryIcon, Settings2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  nextRolloutStep,
  type PortfolioApp,
  type ReleaseStatus,
} from "@/data/apps"
import { NO_VALUE } from "@/lib/format"
import { cn } from "@/lib/utils"

const ORDER: Record<ReleaseStatus["kind"], number> = {
  live: 0,
  staged: 1,
  review: 2,
  development: 3,
  maintenance: 4,
  archived: 5,
}

const NOT_CONNECTED = "Releases module not connected yet"

const buildLabel = (app: PortfolioApp) =>
  app.version ? `v${app.version}${app.build !== null ? ` (${app.build})` : ""}` : NO_VALUE

function storeReviewLabel(app: PortfolioApp) {
  const apple = app.platforms.some((p) => p !== "android" && p !== "web")
  return apple ? "App Store Review" : "Play Review"
}

function RolloutBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-strong"
      >
        <div
          className="h-full rounded-full bg-stream-mrr transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn("w-9 text-right text-xs font-bold tabular-nums", percent < 100 ? "text-mint" : "text-foreground")}>
        {percent}%
      </span>
    </div>
  )
}

export function StagedRollouts({
  apps,
  onPromote,
}: {
  apps: PortfolioApp[]
  onPromote: (app: PortfolioApp) => void
}) {
  const rows = apps
    .filter(
      (a) =>
        a.status.kind === "staged" ||
        a.status.kind === "review" ||
        (a.status.kind === "live" && a.recentlyReleased)
    )
    .sort((a, b) => ORDER[a.status.kind] - ORDER[b.status.kind])

  return (
    <section className="@container/rollouts flex h-full min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-[18px] bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            Fleet Staged Releases &amp; Rollouts
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Active progressive rollouts across app stores with instant controls.
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 shrink-0 rounded-lg bg-foreground/[0.05] px-3 text-[13px] font-semibold hover:bg-foreground/[0.09]"
        >
          <HistoryIcon />
          Release History
        </Button>
      </header>

      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow className="border-0 bg-background hover:bg-background">
            {[
              ["Application", "rounded-l-lg pl-3"],
              ["Build", "hidden @[44rem]/rollouts:table-cell"],
              ["Rollout %", ""],
              ["Store Status", ""],
              ["Actions", "rounded-r-lg pr-3 text-right"],
            ].map(([label, cls]) => (
              <TableHead
                key={label}
                className={cn(
                  "h-10 text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase",
                  cls
                )}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((app) => {
            const Icon = app.icon
            const { status } = app
            return (
              <TableRow key={app.id} className="h-14 hover:bg-[#f8fafc]">
                <TableCell className="pl-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                        APP_TONE_TILE[app.tone]
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <Link to={`/apps/${app.id}`} className="text-sm font-semibold text-foreground hover:underline">
                        {app.name}
                      </Link>
                      {/* Build folds under the name when the Build column is hidden */}
                      <p className="font-mono text-[11px] text-muted-foreground @[44rem]/rollouts:hidden">
                        {buildLabel(app)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground @[44rem]/rollouts:table-cell">
                  {buildLabel(app)}
                </TableCell>
                <TableCell>
                  {status.kind === "review" ? (
                    <span className="text-[13px] text-muted-foreground">Pending</span>
                  ) : (
                    <RolloutBar percent={status.kind === "staged" ? status.rollout : 100} />
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold whitespace-nowrap",
                      status.kind === "live" && "bg-mint-hover text-mint",
                      status.kind === "staged" && "bg-mint-border/70 text-mint",
                      status.kind === "review" && "bg-neutral-strong text-foreground/80"
                    )}
                  >
                    {status.kind === "live"
                      ? "Live"
                      : status.kind === "staged"
                        ? "Staged"
                        : storeReviewLabel(app)}
                  </span>
                </TableCell>
                <TableCell className="pr-3 text-right">
                  {status.kind === "staged" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPromote(app)}
                      disabled
                      title={NOT_CONNECTED}
                      aria-label={`Promote ${app.name} to ${nextRolloutStep(status.rollout)}%`}
                      className="h-8 rounded-lg px-2.5 text-xs font-bold text-mint hover:bg-mint-surface hover:text-mint"
                    >
                      Promote
                      <ArrowRightIcon />
                    </Button>
                  ) : (
                    status.kind === "live" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title={NOT_CONNECTED}
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold"
                      >
                        Rollback
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs font-semibold">
                        <Link to={`/apps/${app.id}`}>Details</Link>
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="h-20 text-center text-sm text-subtle-foreground">
                No active rollouts.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <footer className="flex flex-col gap-2 pt-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Staged rollout rules conform to Apple Phased Release &amp; Google Play
          track policies.
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 self-start rounded-lg px-2.5 text-xs font-semibold sm:self-auto"
        >
          <Settings2Icon />
          Configure Automation
        </Button>
      </footer>
    </section>
  )
}
