import * as React from "react"
import { Link } from "react-router-dom"
import {
  ArchiveIcon,
  ChartNoAxesColumnIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  PencilIcon,
  RocketIcon,
  SquareTerminalIcon,
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

const STATUS: Record<ReleaseStatus["kind"], { label: (s: ReleaseStatus) => string; pill: string; dot: string }> = {
  live: { label: () => "Live Prod", pill: "bg-mint-hover text-mint", dot: "bg-mint" },
  review: {
    label: () => "In Review",
    pill: "bg-neutral-strong text-foreground/80",
    dot: "bg-subtle-foreground",
  },
  staged: {
    label: (s) => (s.kind === "staged" ? `Rollout ${s.rollout}%` : ""),
    pill: "bg-blue-hover text-tertiary",
    dot: "bg-tertiary",
  },
}

function Metric({
  label,
  value,
  sub,
  subClass,
}: {
  label: string
  value: React.ReactNode
  sub: string
  subClass?: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] leading-[14px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[15px] leading-5 font-bold text-foreground tabular-nums">
        {value}
      </dd>
      <dd className={cn("truncate text-[11px] text-muted-foreground tabular-nums", subClass)}>
        {sub}
      </dd>
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
    <article className="flex min-w-0 flex-col rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-2)]">
      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <header className="flex items-start gap-3">
          <Link
            to={`/apps/${app.id}`}
            aria-hidden="true"
            tabIndex={-1}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5.5",
              APP_TONE_TILE[app.tone]
            )}
          >
            <Icon />
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <Link to={`/apps/${app.id}`} className="truncate hover:underline">
                {app.name}
              </Link>
              <span className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
            </h3>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {app.bundleId}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                "inline-flex h-5.5 items-center rounded-full px-2 text-[10px] font-bold tracking-[0.02em] whitespace-nowrap",
                status.pill
              )}
            >
              {status.label(app.status)}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              v{app.version} ({app.build})
            </span>
          </div>
        </header>

        <ul className="flex flex-wrap gap-1.5" aria-label="Platforms">
          {platformTags.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-foreground/80"
            >
              {tag}
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-4 gap-2">
          <Metric
            label="Monthly Rev"
            value={usd.format(app.revenueMonthly)}
            sub={formatSignedPercent(app.revenueGrowth)}
            subClass={app.revenueGrowth >= 0 ? "text-mint font-semibold" : "text-destructive font-semibold"}
          />
          <Metric label="Active Base" value={formatCompact(app.mau)} sub="MAU" />
          <Metric
            label="Crash-Free"
            value={`${app.crashFree.toFixed(2)}%`}
            sub={app.crashNote}
            subClass={app.crashFree < 99.6 ? "text-amber font-semibold" : undefined}
          />
          <Metric
            label="Store Rating"
            value={`${app.rating.toFixed(1)} ★`}
            sub={`${formatCompact(app.ratingCount)} rev`}
          />
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {app.integrations.map((name, i) => (
            <span
              key={name}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                INTEGRATION_TONES[i % INTEGRATION_TONES.length]
              )}
            >
              {name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FlagIcon className="size-3" />
            {app.configFlags} Config Flags
          </span>
        </div>
      </div>

      <footer className="flex items-center gap-1 border-t border-border/70 px-2 py-2">
        {isStaged && app.status.kind === "staged" ? (
          <Button
            size="sm"
            onClick={() => onPromote(app)}
            className="h-9 rounded-lg bg-stream-mrr px-3 text-xs font-semibold text-white hover:bg-stream-mrr/90"
          >
            <RocketIcon />
            Promote to {nextRolloutStep(app.status.rollout)}%
          </Button>
        ) : null}
        {!isStaged && (
          <Button asChild variant="ghost" size="sm" className="h-9 flex-1 rounded-lg text-xs font-semibold">
            <Link to={`/apps/${app.id}`}>Open Console</Link>
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-9 flex-1 rounded-lg text-xs font-semibold text-pink hover:text-pink"
        >
          <Link to={`/remote-config?app=${app.id}`}>Remote Config</Link>
        </Button>
        {!isStaged && (
          <Button variant="ghost" size="icon" className="size-9 rounded-lg" aria-label={`${app.name} analytics`}>
            <ChartNoAxesColumnIcon />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9 rounded-lg" aria-label={`More actions for ${app.name}`}>
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isStaged && (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`/apps/${app.id}`}>
                    <SquareTerminalIcon />
                    Open console
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ChartNoAxesColumnIcon />
                  View analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <PencilIcon />
              Edit store listing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FlagIcon />
              Manage flags
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <ArchiveIcon />
              Archive app
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </article>
  )
}
