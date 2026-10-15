import * as React from "react"
import { Link } from "react-router-dom"

import { CipherOctoLogo } from "@/components/cipherocto-logo"
import { NavMain } from "@/components/nav-main"
import { SidebarOrgFooter } from "@/components/sidebar-org-footer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/data/auth-context"
import { NAV_ITEMS } from "@/lib/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen } = useSidebar()
  const collapsed = state === "collapsed"
  const { can } = useAuth()
  const items = NAV_ITEMS.filter((item) => can(item.permission))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 shrink-0 justify-center overflow-hidden px-4 py-0">
        <Link
          to="/"
          title={collapsed ? "Expand sidebar" : undefined}
          onClick={(event) => {
            // When collapsed, the logo is the way back to the full sidebar
            if (collapsed) {
              event.preventDefault()
              setOpen(true)
            }
          }}
          className="flex items-center gap-2"
        >
          <CipherOctoLogo className="size-8 rounded-lg bg-white/10 [&>svg]:size-6" />
          <span className="text-lg leading-[26px] font-bold tracking-tight whitespace-nowrap text-white transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            CipherOcto
          </span>
          <span className="ml-auto rounded-full bg-mint-border px-1.5 py-0.5 text-[11px] leading-4 font-bold tracking-wider text-mint uppercase transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            Pro
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter className="gap-4 p-4 group-data-[collapsible=icon]:px-2">
        <SidebarOrgFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
