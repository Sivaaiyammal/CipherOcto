import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, SearchXIcon } from "lucide-react"

import { AppDetailToolbar } from "@/components/app-detail/app-detail-toolbar"
import { AppHero } from "@/components/app-detail/app-hero"
import { AppKpis } from "@/components/app-detail/app-kpis"
import { MonetizationPulse } from "@/components/app-detail/monetization-pulse"
import { ScopedRemoteConfig } from "@/components/app-detail/scoped-remote-config"
import { Button } from "@/components/ui/button"
import { getAppDetail } from "@/data/app-details"
import { useApps } from "@/data/apps-context"

export default function AppDetailPage() {
  const { appId } = useParams()
  const { getApp } = useApps()
  const app = getApp(appId)
  const detail = React.useMemo(() => (app ? getAppDetail(app) : null), [app])

  if (!app || !detail) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <SearchXIcon className="size-8 text-muted-foreground" />
          <h1 className="text-[22px] font-semibold text-foreground">App not found</h1>
          <p className="text-sm text-muted-foreground">
            There is no app with the ID “{appId}” in this portfolio.
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/apps">
              <ArrowLeftIcon />
              Back to Apps
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppDetailToolbar app={app} />
      <div className="px-4 lg:px-6">
        <AppHero app={app} detail={detail} />
      </div>
      <div className="px-4 lg:px-6">
        <AppKpis app={app} detail={detail} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
        <div className="min-w-0 @5xl/main:col-span-2">
          {/* key resets the metric tab when switching apps */}
          <MonetizationPulse key={app.id} app={app} detail={detail} />
        </div>
        <ScopedRemoteConfig key={app.id} app={app} />
      </div>
    </>
  )
}
