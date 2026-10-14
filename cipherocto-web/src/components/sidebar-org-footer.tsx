import { CheckIcon, ChevronsUpDownIcon, PlusIcon, SettingsIcon } from "lucide-react"
import { Link } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { APP_QUOTA } from "@/data/apps"
import { useApps } from "@/data/apps-context"

// Placeholder until organizations come from the auth service.
const org = { name: "Octo Corp Org", plan: "Enterprise Plan", initials: "CO" }

export function SidebarOrgFooter() {
  const { apps } = useApps()
  const used = apps.length
  const pct = Math.round((used / APP_QUOTA) * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-white/[0.06] p-3 transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/70">
          <span>Active Apps</span>
          <span className="font-bold text-white tabular-nums">
            {used} / {APP_QUOTA}
          </span>
        </div>
        <div
          role="meter"
          aria-label="Production app quota"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={APP_QUOTA}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"
        >
          <div className="h-full rounded-full bg-mint-border" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-sidebar-foreground/60">
          <span>Production Quota</span>
          <span className="font-semibold text-mint-border tabular-nums">{pct}%</span>
        </div>
      </div>

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={org.name}
                className="gap-3 rounded-[10px] px-2.5 data-[state=open]:bg-sidebar-accent"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint-border text-xs font-bold text-mint">
                  {org.initials}
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                  <span className="truncate text-[13px] font-semibold text-white">{org.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">{org.plan}</span>
                </span>
                <ChevronsUpDownIcon className="ml-auto text-sidebar-foreground/60 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="min-w-56">
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              <DropdownMenuItem>
                <span className="flex size-5 items-center justify-center rounded-full bg-mint-border text-[10px] font-bold text-mint">
                  {org.initials}
                </span>
                {org.name}
                <CheckIcon className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <SettingsIcon />
                  Organization settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <PlusIcon />
                Create organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}
