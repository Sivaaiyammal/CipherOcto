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
import { APP_TONE_TILE, type PortfolioApp } from "@/data/apps"
import { useApps } from "@/data/apps-context"
import { cn } from "@/lib/utils"

function statusText(app: PortfolioApp) {
  switch (app.status.kind) {
    case "live":
      return { label: `Live Production v${app.version}`, className: "bg-mint-hover text-mint", dot: "bg-mint" }
    case "staged":
      return {
        label: `Staged Rollout ${app.status.rollout}% · v${app.version}`,
        className: "bg-blue-hover text-tertiary",
        dot: "bg-tertiary",
      }
    case "review":
      return {
        label: `In Store Review · v${app.version}`,
        className: "bg-neutral-strong text-foreground/80",
        dot: "bg-subtle-foreground",
      }
  }
}

export function AppDetailToolbar({ app }: { app: PortfolioApp }) {
  const { apps } = useApps()
  const navigate = useNavigate()
  const status = statusText(app)
  const onApple = app.platforms.some((p) => p === "ios" || p === "watchos" || p === "macos")
  const onAndroid = app.platforms.includes("android")

  return (
    <section className="flex flex-col gap-3 px-4 lg:px-6 @3xl/main:flex-row @3xl/main:items-center @3xl/main:justify-between">
      <span
        className={cn(
          "inline-flex h-7 items-center gap-1.5 self-start rounded-full px-3 text-xs font-bold @3xl/main:self-auto",
          status.className
        )}
      >
        <span className={cn("size-1.5 rounded-full", status.dot)} />
        {status.label}
      </span>

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
            <a href="https://play.google.com/console" target="_blank" rel="noreferrer">
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
              {app.configFlags} flags
            </span>
          </Link>
        </Button>
        <Button className="h-9 rounded-[10px] px-3.5 text-[13px] font-semibold">
          <RocketIcon className="text-mint-border" />
          Create Staged Release
        </Button>
      </div>
    </section>
  )
}
