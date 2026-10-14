import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, SearchXIcon } from "lucide-react"

import { AppDetailToolbar } from "@/components/app-detail/app-detail-toolbar"
import { AppHero } from "@/components/app-detail/app-hero"
import { AppKpis } from "@/components/app-detail/app-kpis"
import { CatalogSkus } from "@/components/app-detail/catalog-skus"
import { EnvironmentDock } from "@/components/app-detail/environment-dock"
import { MetadataAso } from "@/components/app-detail/metadata-aso"
import { MonetizationPulse } from "@/components/app-detail/monetization-pulse"
import { ReleasePipeline } from "@/components/app-detail/release-pipeline"
import { ScopedRemoteConfig } from "@/components/app-detail/scoped-remote-config"
import { SentimentPulse } from "@/components/app-detail/sentiment-pulse"
import { Button } from "@/components/ui/button"
import { getAppDetail } from "@/data/app-details"
import {
  getAso,
  getBuildHash,
  getCatalog,
  getReleasePipeline,
  getSentiment,
} from "@/data/app-insights"
import { useApps } from "@/data/apps-context"

export default function AppDetailPage() {
  const { appId } = useParams()
  const { getApp } = useApps()
  const app = getApp(appId)

  const insights = React.useMemo(() => {
    if (!app) return null
    const detail = getAppDetail(app)
    const pipeline = getReleasePipeline(app, detail)
    const candidate = pipeline.find((b) => b.stage === "candidate")
    return {
      detail,
      pipeline,
      candidate,
      catalog: getCatalog(app, detail),
      aso: getAso(app),
      sentiment: getSentiment(app, candidate ?? { version: app.version, build: app.build }),
      buildHash: getBuildHash(app),
    }
  }, [app])

  if (!app || !insights) {
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

  const { detail } = insights

  return (
    <>
      <AppDetailToolbar app={app} />
      <div className="px-4 lg:px-6">
        <AppHero app={app} detail={detail} />
      </div>
      <div className="px-4 lg:px-6">
        <AppKpis app={app} detail={detail} />
      </div>

      {/* key resets per-app local state (tabs, toggles) when switching apps */}
      <div key={app.id} className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 @5xl/main:col-span-8">
          <MonetizationPulse app={app} detail={detail} />
          <CatalogSkus appName={app.name} skus={insights.catalog} />
          <ReleasePipeline builds={insights.pipeline} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 @5xl/main:col-span-4">
          <ScopedRemoteConfig app={app} />
          <MetadataAso aso={insights.aso} />
          <SentimentPulse sentiment={insights.sentiment} version={app.version} />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <EnvironmentDock key={app.id} app={app} candidate={insights.candidate} buildHash={insights.buildHash} />
      </div>
    </>
  )
}
