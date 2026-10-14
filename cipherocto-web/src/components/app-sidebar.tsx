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
import { NAV_ITEMS } from "@/lib/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden px-2 pt-5 pb-4">
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
          className="flex items-center gap-3"
        >
          <CipherOctoLogo />
          <span className="text-[22px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-white transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            CipherOcto
          </span>
          <span className="ml-auto rounded-full bg-mint-border px-2.5 py-0.5 text-[11px] leading-4 font-bold tracking-[0.04em] text-mint transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            PRO
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>
      <SidebarFooter className="px-1 pb-3">
        <SidebarOrgFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
