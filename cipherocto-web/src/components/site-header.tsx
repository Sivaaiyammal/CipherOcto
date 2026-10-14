import * as React from "react"
import { Link, useLocation, useMatch, useNavigate } from "react-router-dom"
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  CircleUserRoundIcon,
  LogOutIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { currentUser } from "@/lib/current-user"
import { useApps } from "@/data/apps-context"
import { useAuth } from "@/data/auth-context"
import { findNavItem } from "@/lib/navigation"

const DATE_PRESETS = [
  { id: "7d", label: "Last 7 Days", days: 7 },
  { id: "30d", label: "Last 30 Days", days: 30 },
  { id: "90d", label: "Last 90 Days", days: 90 },
  { id: "365d", label: "Last 12 Months", days: 365 },
] as const

type DatePresetId = (typeof DATE_PRESETS)[number]["id"]

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)

// Warm translucent fill so controls sit naturally on the #FAF8F5 canvas
const controlSurface =
  "rounded-lg bg-foreground/[0.035] transition-colors hover:bg-foreground/[0.06]"

function formatRange(days: number) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))

  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${startLabel} – ${endLabel}`
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function HeaderSearch() {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <label
      className={`${controlSurface} flex h-8 w-full max-w-72 cursor-text items-center gap-2 px-3 md:max-w-80 focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/10`}
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search commands, metrics, apps…"
        aria-label="Search"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
      />
      <kbd className="hidden shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-[0_0_0_1px_var(--border)] sm:inline-block">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </label>
  )
}

function DateRangePicker() {
  const [presetId, setPresetId] = React.useState<DatePresetId>("30d")
  const preset = DATE_PRESETS.find((p) => p.id === presetId) ?? DATE_PRESETS[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${controlSurface} flex h-8 shrink-0 items-center gap-1.5 px-4 text-[13px] font-semibold text-foreground tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/10`}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="hidden 2xl:inline">
            {preset.label}: {formatRange(preset.days)}
          </span>
          <span className="2xl:hidden" title={formatRange(preset.days)}>
            {preset.label}
          </span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>Date range</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={presetId}
          onValueChange={(value) => setPresetId(value as DatePresetId)}
        >
          {DATE_PRESETS.map((p) => (
            <DropdownMenuRadioItem key={p.id} value={p.id}>
              {p.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Notifications({ hasUnread = true }: { hasUnread?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-9 rounded-lg text-muted-foreground"
      aria-label={hasUnread ? "Notifications (unread)" : "Notifications"}
    >
      <BellIcon className="size-5" />
      {hasUnread && (
        <span className="absolute top-2 right-2.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
      )}
    </Button>
  )
}

function UserMenu() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2.5 rounded-lg p-1 pr-2 text-left outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:ring-[3px] focus-visible:ring-ring/10"
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="bg-tertiary text-xs font-semibold text-tertiary-foreground">
              {initials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden flex-col leading-tight lg:flex">
            <span className="text-[13px] font-semibold text-foreground">
              {currentUser.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentUser.role}
            </span>
          </span>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-semibold">{currentUser.name}</div>
          <div className="text-xs text-muted-foreground">{session?.email ?? currentUser.role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <CircleUserRoundIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <SettingsIcon />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut()
            navigate("/login", { replace: true })
          }}
        >
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const navItem = findNavItem(pathname)
  const title = navItem?.pageTitle ?? navItem?.title ?? "Not found"
  const appMatch = useMatch("/apps/:appId")
  const { getApp } = useApps()
  const app = appMatch ? getApp(appMatch.params.appId) : undefined

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center bg-background/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl md:rounded-t-xl transition-[width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="hidden shrink-0 sm:block">
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">CipherOcto</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {navItem?.group && !appMatch && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="hidden xl:inline-flex">
                  {navItem.group}
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator
              className={navItem?.group && !appMatch ? "hidden xl:block" : undefined}
            />
            {appMatch ? (
              <>
                <BreadcrumbItem className="hidden md:inline-flex">
                  <BreadcrumbLink asChild>
                    <Link to="/apps">{title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    {app?.name ?? "Unknown app"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-2 flex min-w-0 flex-1 items-center gap-3">
          <HeaderSearch />
          <DateRangePicker />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <Notifications />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
