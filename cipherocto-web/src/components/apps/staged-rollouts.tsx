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
} from "@/data/apps"
import { cn } from "@/lib/utils"

const ORDER = { live: 0, staged: 1, review: 2 } as const

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
        className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-strong"
      >
        <div
          className="h-full rounded-full bg-stream-mrr transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-bold text-foreground tabular-nums">
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
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-1)]">
      <header className="flex items-start justify-between gap-3 p-5 lg:p-6">
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
          className="h-9 shrink-0 rounded-[10px] bg-neutral-strong px-3 text-[13px] font-semibold hover:bg-neutral-deep"
        >
          <HistoryIcon />
          Release History
        </Button>
      </header>

      <Table className="min-w-[600px]">
        <TableHeader className="bg-background">
          <TableRow className="hover:bg-transparent">
            {[
              ["Application", "pl-5 lg:pl-6"],
              ["Build", ""],
              ["Rollout %", ""],
              ["Store Status", ""],
              ["Actions", "pr-5 text-right lg:pr-6"],
            ].map(([label, cls]) => (
              <TableHead
                key={label}
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
          {rows.map((app) => {
            const Icon = app.icon
            const { status } = app
            return (
              <TableRow key={app.id} className="h-16 hover:bg-[#f8fafc]">
                <TableCell className="pl-5 lg:pl-6">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                        APP_TONE_TILE[app.tone]
                      )}
                    >
                      <Icon />
                    </span>
                    <Link to={`/apps/${app.id}`} className="text-sm font-semibold text-foreground hover:underline">
                      {app.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  v{app.version} ({app.build})
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
                <TableCell className="pr-5 text-right lg:pr-6">
                  {status.kind === "staged" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPromote(app)}
                      className="h-8 rounded-lg px-2.5 text-xs font-bold text-mint hover:bg-mint-surface hover:text-mint"
                    >
                      Promote to {nextRolloutStep(status.rollout)}%
                      <ArrowRightIcon />
                    </Button>
                  ) : (
                    status.kind === "live" ? (
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs font-semibold">
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

      <footer className="mt-auto flex flex-col gap-2 border-t border-border/70 px-5 py-3.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-6">
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
