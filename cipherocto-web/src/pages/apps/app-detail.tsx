import { Link, useParams } from "react-router-dom"
import { AlertTriangleIcon, ArrowLeftIcon, LoaderIcon, SearchXIcon } from "lucide-react"

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
import { useAppDetail } from "@/data/app-details"
import { catalogFromProducts, getBuildHash, NO_ASO, NO_BUILDS } from "@/data/app-insights"
import type { PortfolioApp } from "@/data/apps"
import { useApps } from "@/data/apps-context"

function StateCard({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 lg:px-6">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
        {icon}
        <h1 className="text-[22px] font-semibold text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  )
}

export default function AppDetailPage() {
  const { appId } = useParams()
  const { getApp, status, error, refresh } = useApps()
  const app = getApp(appId)

  if (!app) {
    if (status === "idle" || status === "loading") {
      return (
        <StateCard icon={<LoaderIcon className="size-8 animate-spin text-muted-foreground" />} title="Loading app…" />
      )
    }
    if (status === "error") {
      return (
        <StateCard icon={<AlertTriangleIcon className="size-8 text-destructive" />} title="Couldn't load your apps">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="rounded-xl" onClick={() => void refresh()}>
            Retry
          </Button>
        </StateCard>
      )
    }
    return (
      <StateCard icon={<SearchXIcon className="size-8 text-muted-foreground" />} title="App not found">
        <p className="text-sm text-muted-foreground">There is no app with the ID “{appId}” in this portfolio.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/apps">
            <ArrowLeftIcon />
            Back to Apps
          </Link>
        </Button>
      </StateCard>
    )
  }

  return <AppDetailBody app={app} />
}

function AppDetailBody({ app }: { app: PortfolioApp }) {
  const { detail, products, summary, canSeeBilling, loading, error } = useAppDetail(app)
  const catalog = catalogFromProducts(products)

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
          <CatalogSkus
            appName={app.name}
            skus={catalog}
            loading={loading}
            error={error}
            canSeeBilling={canSeeBilling}
            notificationsConfigured={summary ? summary.notificationsConfigured : null}
          />
          <ReleasePipeline builds={NO_BUILDS} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 @5xl/main:col-span-4">
          <ScopedRemoteConfig app={app} />
          <MetadataAso aso={NO_ASO} />
          <SentimentPulse sentiment={null} version={app.version} />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <EnvironmentDock
          key={app.id}
          app={app}
          candidate={undefined}
          buildHash={getBuildHash()}
          notificationsConfigured={summary ? summary.notificationsConfigured : null}
        />
      </div>
    </>
  )
}
