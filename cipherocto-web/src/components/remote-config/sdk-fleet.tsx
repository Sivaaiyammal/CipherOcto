import { BadgeCheckIcon, LayersIcon, PlayIcon, SmartphoneIcon } from "lucide-react"

import { relativeTime, type AuditEntry } from "@/data/remote-config"

const SDKS = [
  { name: "iOS SDK v4.2.0", sync: "99.8% Sync Success", icon: SmartphoneIcon },
  { name: "Android SDK v4.1.8", sync: "99.4% Sync Success", icon: PlayIcon },
  { name: "Flutter & RN v3.9.0", sync: "99.9% Sync Success", icon: LayersIcon },
]

export function SdkFleet({
  latest,
  previous,
  onRevert,
}: {
  latest: AuditEntry | undefined
  previous: AuditEntry | undefined
  onRevert: (entry: AuditEntry) => void
}) {
  return (
    <section className="space-y-4 rounded-[18px] bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex flex-col justify-between gap-3 pb-2 @3xl/main:flex-row @3xl/main:items-center">
        <div>
          <h3 className="text-lg leading-[26px] font-bold tracking-tight text-foreground">Deployment &amp; SDK Fleet Telemetry</h3>
          <p className="text-[13px] text-muted-foreground">Real-time sync health across client SDK bundles.</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Telemetry status:
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-surface px-2.5 py-1 text-[11px] font-bold text-mint">
            <span className="size-2 rounded-full bg-stream-mrr" />
            All Gateways Normal
          </span>
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 @3xl/main:grid-cols-3">
        {SDKS.map(({ name, sync, icon: Icon }) => (
          <div key={name} className="flex items-center justify-between gap-2 rounded-xl bg-background p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-strong text-foreground">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{sync}</p>
              </div>
            </div>
            <span className="rounded-full bg-mint-hover px-2 py-0.5 text-[10px] font-bold text-mint">Healthy</span>
          </div>
        ))}
      </div>

      {latest && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <BadgeCheckIcon className="size-4 text-mint" />
            <span className="font-semibold text-foreground">Config Build #v{latest.build}</span>
            <span className="text-muted-foreground">
              published by {latest.by} ({latest.env === "production" ? "Production" : "Staging"})
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              SHA: <code className="rounded bg-neutral-strong px-1 py-0.5 font-mono text-[11px]">{latest.id.slice(0, 7)}</code>
            </span>
            <span>{relativeTime(latest.at)}</span>
            {previous && (
              <button type="button" onClick={() => onRevert(previous)} className="font-bold text-foreground hover:underline">
                Revert to v{previous.build}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
