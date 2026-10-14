import * as React from "react"
import { GitBranchIcon, PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PipelineBuild } from "@/data/app-insights"
import { cn } from "@/lib/utils"

const BADGE_TONE = {
  mint: "bg-mint-hover text-mint",
  blue: "bg-blue-hover text-tertiary",
  outline: "bg-card text-muted-foreground shadow-[0_0_0_1px_var(--border)]",
}

const FACT_TONE = {
  mint: "text-mint",
  danger: "text-destructive",
}

export function ReleasePipeline({ builds }: { builds: PipelineBuild[] }) {
  // Local until the release service exists; resets on reload.
  const [started, setStarted] = React.useState(false)

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 items-center justify-center rounded-md bg-mint-hover text-mint [&_svg]:size-3.5">
            <GitBranchIcon />
          </span>
          <div>
            <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
              Release Pipeline &amp; Phased Deployment
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Storefront version staging, staged rollouts, and build audits.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-strong px-2.5 py-1 text-xs font-semibold text-foreground/80">
          {builds.length} Active Builds
        </span>
      </header>

      <ul className="flex flex-col gap-2.5">
        {builds.map((build) => {
          const candidate = build.stage === "candidate"
          return (
            <li
              key={build.build}
              className={cn(
                "flex flex-col gap-3 rounded-xl p-4 @3xl/main:flex-row @3xl/main:items-center @3xl/main:justify-between",
                candidate ? "bg-blue-surface" : "bg-background"
              )}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      candidate ? "bg-tertiary motion-safe:animate-pulse" : "bg-mint"
                    )}
                  />
                  <span className="text-[13px] font-bold text-foreground tabular-nums">
                    v{build.version} (Build {build.build}
                    {candidate ? " RC2" : ""})
                  </span>
                  {build.badges.map((b) => (
                    <span key={b.label} className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", BADGE_TONE[b.tone])}>
                      {b.label}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground">{build.summary}</p>
                <dl className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1 text-[11px] text-muted-foreground">
                  {build.facts.map((f) => (
                    <div key={f.label} className="flex gap-1">
                      <dt>{f.label}:</dt>
                      <dd className={cn("font-semibold text-foreground", f.tone && FACT_TONE[f.tone])}>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {candidate ? (
                  <Button
                    size="sm"
                    disabled={started}
                    onClick={() => setStarted(true)}
                    className="h-9 rounded-lg px-3 text-xs font-bold"
                  >
                    <PlayIcon />
                    {started ? "Rolling out to 10%…" : "Start 10% Phased Rollout"}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg px-3 text-xs font-semibold">
                      Changelog
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg px-3 text-xs font-semibold">
                      Telemetry
                    </Button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
