import * as React from "react"
import { Link } from "react-router-dom"
import {
  ArchiveIcon,
  ChartNoAxesColumnIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  PencilIcon,
  StarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  APP_TONE_TILE,
  nextRolloutStep,
  PLATFORM_LABEL,
  type PortfolioApp,
  type ReleaseStatus,
} from "@/data/apps"
import { formatCompact, formatSignedPercent, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const INTEGRATION_TONES = [
  "bg-blue-surface text-tertiary",
  "bg-mint-surface text-mint",
  "bg-lavender-surface text-lavender",
]

const STATUS: Record<
  ReleaseStatus["kind"],
  { label: (s: ReleaseStatus) => string; pill: string; dot: string; title: string }
> = {
  live: {
    label: () => "Live Prod",
    pill: "bg-mint-hover text-mint",
    dot: "bg-mint",
    title: "Production healthy",
  },
  review: {
    label: () => "In Review",
    pill: "bg-neutral-strong text-foreground/80",
    dot: "bg-subtle-foreground",
    title: "Awaiting store review",
  },
  staged: {
    label: (s) => (s.kind === "staged" ? `Rollout ${s.rollout}%` : ""),
    pill: "bg-mint-hover text-mint",
    dot: "bg-mint",
    title: "Staged rollout in progress",
  },
}

function Metric({
  label,
  value,
  sub,
  valueClass,
  subClass,
}: {
  label: string
  value: React.ReactNode
  sub: string
  valueClass?: string
  subClass?: string
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-[13px] font-bold text-foreground tabular-nums", valueClass)}>
        {value}
      </dd>
      <dd className={cn("truncate text-[10px] text-muted-foreground tabular-nums", subClass)}>{sub}</dd>
    </div>
  )
}

export function AppCard({
  app,
  onPromote,
}: {
  app: PortfolioApp
  onPromote: (app: PortfolioApp) => void
}) {
  const Icon = app.icon
  const status = STATUS[app.status.kind]
  const isStaged = app.status.kind === "staged"
  const platformTags =
    app.platforms.length === 1 && app.platforms[0] === "android"
      ? ["Android Only"]
      : app.platforms.map((p) => PLATFORM_LABEL[p])

  return (
    <article className="group @container/card flex min-w-0 flex-col justify-between overflow-hidden rounded-[18px] bg-card shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-2)]">
      <div className="flex flex-col gap-4 p-5 @7xl/main:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={`/apps/${app.id}`}
              aria-hidden="true"
              tabIndex={-1}
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-transform duration-200 group-hover:scale-105 [&_svg]:size-7",
                APP_TONE_TILE[app.tone]
              )}
            >
              <Icon />
            </Link>
            <div className="flex min-w-0 flex-col">
              <h3 className="flex min-w-0 items-center gap-2 text-lg leading-[26px] font-bold tracking-[-0.01em] text-foreground">
                <Link to={`/apps/${app.id}`} className="truncate hover:underline">
                  {app.name}
                </Link>
                {app.status.kind !== "review" && (
                  <span className={cn("size-2 shrink-0 rounded-full", status.dot)} title={status.title} />
                )}
              </h3>
              <span className="truncate text-xs text-muted-foreground">{app.bundleId}</span>
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Platforms">
                {platformTags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded bg-foreground/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap",
                status.pill
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label(app.status)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              v{app.version} ({app.build})
            </span>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl bg-background px-3 py-2.5 @[26rem]/card:grid-cols-4 @[26rem]/card:gap-2 @[26rem]/card:py-2">
          <Metric
            label="Monthly Rev"
            value={usd.format(app.revenueMonthly)}
            sub={formatSignedPercent(app.revenueGrowth)}
            subClass={cn("font-semibold", app.revenueGrowth >= 0 ? "text-mint" : "text-destructive")}
          />
          <Metric label="Active Base" value={formatCompact(app.mau)} sub="MAU" />
          <Metric
            label="Crash-Free"
            value={`${app.crashFree.toFixed(2)}%`}
            valueClass={app.crashFree >= 99.85 ? "text-mint" : app.crashFree < 99.6 ? "text-amber" : undefined}
            sub={app.crashNote}
          />
          <Metric
            label="Store Rating"
            value={
              <span className="inline-flex items-center gap-0.5">
                {app.rating.toFixed(1)}
                <StarIcon className="size-3 fill-foreground" />
              </span>
            }
            sub={`${formatCompact(app.ratingCount)} rev`}
          />
        </dl>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {app.integrations.map((name, i) => (
            <span
              key={name}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium",
                INTEGRATION_TONES[i % INTEGRATION_TONES.length]
              )}
            >
              {name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.05] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-mint" />
            {app.configFlags} Config Flags
          </span>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-2 bg-foreground/[0.025] px-5 py-3 @7xl/main:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {isStaged && app.status.kind === "staged" ? (
            <>
              <Button
                size="sm"
                onClick={() => onPromote(app)}
                className="h-8 rounded-lg bg-stream-mrr px-3 text-[13px] font-semibold text-white hover:bg-stream-mrr/90"
              >
                Promote to {nextRolloutStep(app.status.rollout)}%
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-[13px]">
                <Link to={`/apps/${app.id}`}>Console</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg bg-card px-3 text-[13px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-foreground/[0.06]"
              >
                <Link to={`/apps/${app.id}`}>Open Console</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
              >
                <Link to={`/remote-config?app=${app.id}`}>Remote Config</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Link to={`/apps/${app.id}`} aria-label={`${app.name} analytics`} title="View Analytics">
              <ChartNoAxesColumnIcon />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label={`More actions for ${app.name}`}
                title="App Settings"
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isStaged && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={`/remote-config?app=${app.id}`}>
                      <FlagIcon />
                      Remote Config
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <PencilIcon />
                Edit store listing
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/remote-config?app=${app.id}`}>
                  <FlagIcon />
                  Manage flags
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <ArchiveIcon />
                Archive app
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </footer>
    </article>
  )
}
