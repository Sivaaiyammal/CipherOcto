import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AbExperimentCard } from "@/components/dashboard/ab-experiment-card"
import { ActivityStream } from "@/components/dashboard/activity-stream"
import { AppsPortfolio } from "@/components/dashboard/apps-portfolio"
import { ExpenseSplit } from "@/components/dashboard/expense-split"
import { KpiOverview } from "@/components/dashboard/kpi-overview"
import { QuickRemoteFlags } from "@/components/dashboard/quick-remote-flags"
import { RevenueByApp } from "@/components/dashboard/revenue-by-app"
import { RevenueOverview } from "@/components/dashboard/revenue-overview"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--sidebar-width-icon": "3.5rem",
          "--header-height": "calc(var(--spacing) * 16)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <WelcomeBanner liveApps={8} periodLabel="last 30 days" />
              <KpiOverview />
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
                <div className="min-w-0 @5xl/main:col-span-2">
                  <RevenueOverview />
                </div>
                <div className="flex min-w-0 flex-col gap-4 @3xl/main:grid @3xl/main:grid-cols-2 @5xl/main:flex">
                  <RevenueByApp />
                  <ExpenseSplit />
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <AppsPortfolio />
              </div>
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2 @5xl/main:grid-cols-3">
                <ActivityStream />
                <QuickRemoteFlags />
                <AbExperimentCard />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
