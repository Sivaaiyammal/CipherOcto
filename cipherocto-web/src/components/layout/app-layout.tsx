import type { CSSProperties } from "react"
import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function AppLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "260px",
          "--sidebar-width-icon": "4rem",
          "--header-height": "calc(var(--spacing) * 16)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 py-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
