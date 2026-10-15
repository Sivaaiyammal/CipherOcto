import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  RocketIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { APP_TONE_TILE, toPortfolioApp, type PortfolioApp } from "@/data/apps"
import { useApps } from "@/data/apps-context"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import { billingApi, type BackendAppStatus } from "@/lib/billing-api"
import { NO_ACCESS_HINT } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS: { value: BackendAppStatus; label: string }[] = [
  { value: "development", label: "In development" },
  { value: "testing", label: "Testing" },
  { value: "production", label: "Production" },
  { value: "maintenance", label: "Maintenance" },
  { value: "archived", label: "Archived" },
]

function statusText(app: PortfolioApp) {
  const v = app.version ? ` · v${app.version}` : ""
  switch (app.status.kind) {
    case "live":
      return { label: `Live Production${v}`, className: "bg-mint-hover text-mint", dot: "bg-mint" }
    case "staged":
      return {
        label: `Staged Rollout ${app.status.rollout}%${v}`,
        className: "bg-blue-hover text-tertiary",
        dot: "bg-tertiary",
      }
    case "review":
      return {
        label: `In Testing${v}`,
        className: "bg-neutral-strong text-foreground/80",
        dot: "bg-subtle-foreground",
      }
    case "development":
      return { label: `In Development${v}`, className: "bg-neutral-strong text-foreground/80", dot: "bg-subtle-foreground" }
    case "maintenance":
      return { label: `Maintenance${v}`, className: "bg-blue-hover text-tertiary", dot: "bg-tertiary" }
    case "archived":
      return { label: `Archived${v}`, className: "bg-neutral-strong text-foreground/80", dot: "bg-subtle-foreground" }
  }
}

export function AppDetailToolbar({ app }: { app: PortfolioApp }) {
  const { apps, upsert } = useApps()
  const { can } = useAuth()
  const canWrite = can("apps:write")
  const navigate = useNavigate()
  const status = statusText(app)
  const [saving, setSaving] = React.useState(false)
  const [statusError, setStatusError] = React.useState<string | null>(null)

  async function changeStatus(next: BackendAppStatus) {
    if (next === app.lifecycle) return
    setSaving(true)
    setStatusError(null)
    try {
      upsert(toPortfolioApp(await billingApi.updateApp(app.id, { status: next })))
    } catch (e) {
      setStatusError(e instanceof ApiError ? e.message : "Couldn't update the status.")
    } finally {
      setSaving(false)
    }
  }
  const onApple = app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  const onAndroid = app.platforms.includes("android")

  return (
    <section className="flex flex-col gap-3 px-4 lg:px-6 @3xl/main:flex-row @3xl/main:items-center @3xl/main:justify-between">
      <div className="flex flex-wrap items-center gap-2 self-start @3xl/main:self-auto">
        {canWrite ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={saving}
                aria-label="Change app status"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold disabled:opacity-60",
                  status.className
                )}
              >
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
                <ChevronDownIcon className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>App status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={app.lifecycle} onValueChange={(v) => void changeStatus(v as BackendAppStatus)}>
                {STATUS_OPTIONS.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            title={NO_ACCESS_HINT}
            className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold", status.className)}
          >
            <span className={cn("size-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        )}
        {statusError && (
          <span role="alert" className="text-xs font-medium text-destructive">
            {statusError}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 rounded-[10px] px-3 text-[13px] font-semibold">
              <span className="size-1.5 rounded-full bg-mint" />
              Switch App: {app.name}
              <ChevronDownIcon className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60">
            <DropdownMenuLabel>Portfolio apps</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={app.id} onValueChange={(id) => navigate(`/apps/${id}`)}>
              {apps.map((a) => {
                const Icon = a.icon
                return (
                  <DropdownMenuRadioItem key={a.id} value={a.id}>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md [&_svg]:size-3.5",
                        APP_TONE_TILE[a.tone]
                      )}
                    >
                      <Icon />
                    </span>
                    {a.name}
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {onApple && (
          <Button asChild variant="outline" className="h-9 rounded-[10px] px-3 text-[13px] font-semibold">
            <a href="https://appstoreconnect.apple.com/apps" target="_blank" rel="noreferrer">
              App Store
              <ArrowUpRightIcon className="text-muted-foreground" />
            </a>
          </Button>
        )}
        {onAndroid && (
          <Button asChild variant="outline" className="h-9 rounded-[10px] px-3 text-[13px] font-semibold">
            <a href={app.playConsoleUrl || "https://play.google.com/console"} target="_blank" rel="noreferrer">
              Google Play
              <ArrowUpRightIcon className="text-muted-foreground" />
            </a>
          </Button>
        )}

        <Button
          asChild
          variant="ghost"
          className="h-9 rounded-[10px] bg-mint-hover px-3 text-[13px] font-semibold text-mint hover:bg-mint-border/70 hover:text-mint"
        >
          <Link to={`/remote-config?app=${app.id}`}>
            <SlidersHorizontalIcon />
            Remote Config
            <span className="rounded-full bg-card/80 px-1.5 text-[11px] tabular-nums">
              {app.configFlags === null ? "—" : app.configFlags} flags
            </span>
          </Link>
        </Button>
        <Button
          disabled
          title="Needs the releases module, which isn't connected yet."
          className="h-9 rounded-[10px] px-3.5 text-[13px] font-semibold"
        >
          <RocketIcon className="text-mint-border" />
          Create Staged Release
        </Button>
      </div>
    </section>
  )
}
