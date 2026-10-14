import { Link } from "react-router-dom"

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
  PLATFORM_LABEL,
  releaseStatusLabel,
  type PortfolioApp,
} from "@/data/apps"
import { formatCompact, formatSignedPercent, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const HEADERS: [string, string][] = [
  ["App", "pl-5"],
  ["Platforms", ""],
  ["Status", ""],
  ["Monthly Rev", "text-right"],
  ["MAU", "text-right"],
  ["Crash-Free", "text-right"],
  ["Rating", "text-right"],
  ["", "pr-5"],
]

export function AppsListView({ apps }: { apps: PortfolioApp[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-1)]">
      <Table className="min-w-[860px]">
        <TableHeader className="bg-background">
          <TableRow className="hover:bg-transparent">
            {HEADERS.map(([label, cls], i) => (
              <TableHead
                key={i}
                className={cn(
                  "h-11 text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase",
                  cls
                )}
              >
                {label || <span className="sr-only">Actions</span>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <TableRow key={app.id} className="h-16 hover:bg-[#f8fafc]">
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5",
                        APP_TONE_TILE[app.tone]
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="leading-tight">
                      <Link to={`/apps/${app.id}`} className="text-sm font-semibold text-foreground hover:underline">
                        {app.name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted-foreground">{app.bundleId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {app.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")}
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground/80">
                  {releaseStatusLabel(app.status)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  <span className="font-bold text-foreground">{usd.format(app.revenueMonthly)}</span>{" "}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      app.revenueGrowth >= 0 ? "text-mint" : "text-destructive"
                    )}
                  >
                    {formatSignedPercent(app.revenueGrowth)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatCompact(app.mau)}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {app.crashFree.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {app.rating.toFixed(1)} ★
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold">
                    <Link to={`/remote-config?app=${app.id}`}>Remote Config</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
