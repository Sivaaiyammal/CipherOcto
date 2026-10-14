import * as React from "react"
import { CheckIcon, CopyIcon, CornerDownRightIcon, ListFilterIcon } from "lucide-react"

import { estimateReach, sdkSnippet, type RemoteParam } from "@/data/remote-config"
import { integer } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AudienceInspector({
  param,
  scopedMau,
  totalMau,
}: {
  param: RemoteParam | null
  scopedMau: number
  totalMau: number
}) {
  const [lang, setLang] = React.useState<"swift" | "kotlin">("swift")
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  if (!param) {
    return (
      <section className="rounded-[18px] bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-1)]">
        Select a parameter to inspect its audience rules.
      </section>
    )
  }

  const rule = param.rules[0]
  const reach = estimateReach(rule, scopedMau, totalMau)
  const blast = reach.pctOfMau < 0.25 ? "Low Blast Radius" : reach.pctOfMau < 0.6 ? "Medium Blast Radius" : "High Blast Radius"
  const snippet = sdkSnippet(param, lang)

  return (
    <section className="space-y-4 rounded-[18px] bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-mint-hover text-mint">
            <ListFilterIcon className="size-4" />
          </span>
          <h2 className="text-lg leading-[26px] font-bold tracking-tight text-foreground">Audience Inspector</h2>
        </div>
        <span className="rounded-full bg-mint-surface px-2 py-0.5 text-[10px] font-bold text-mint">Live Simulation</span>
      </header>
      <p className="text-[13px] text-muted-foreground">
        Rules for <code className="rounded bg-background px-1 font-mono text-[12px] text-foreground">{param.key}</code> are evaluated top to
        bottom; the first match returns the client payload.
      </p>

      {param.rules.length === 0 ? (
        <div className="rounded-xl bg-background p-4 text-[13px] text-muted-foreground">
          No audience rules — every client in scope receives{" "}
          <code className="font-mono text-foreground">{param.value}</code>
          {param.distribution.kind === "rollout" && param.distribution.pct < 100 && ` at ${param.distribution.pct}% rollout`}.
        </div>
      ) : (
        param.rules.map((r, ri) => (
          <div key={r.name} className="space-y-3 rounded-xl bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-[0.04em] text-foreground uppercase">
                Rule #{ri + 1}: {r.name}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-semibold",
                  r.active && param.enabled ? "bg-mint-hover text-mint" : "bg-neutral-strong text-muted-foreground"
                )}
              >
                {r.active && param.enabled ? "Active" : "Paused"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {r.conditions.map((c, i) => (
                <React.Fragment key={`${c.attr}-${i}`}>
                  {i > 0 && (
                    <div className="flex items-center gap-1 pl-4 text-[11px] font-bold text-tertiary">
                      <CornerDownRightIcon className="size-3" />
                      AND
                    </div>
                  )}
                  <div className={cn("flex flex-wrap items-center gap-1.5", i > 0 && "pl-4")}>
                    {i === 0 && <span className="rounded bg-card px-2 py-1 font-mono font-bold text-foreground">IF</span>}
                    <span className="rounded bg-neutral-strong px-2 py-1 text-foreground">{c.attr}</span>
                    <span className="font-bold text-muted-foreground">{c.op}</span>
                    <span className="rounded bg-neutral-strong px-2 py-1 font-mono font-bold text-foreground">{c.value}</span>
                  </div>
                </React.Fragment>
              ))}
              <div className="space-y-1 rounded-lg bg-mint-surface p-2.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-mint">
                  <CheckIcon className="size-3.5" />
                  THEN SERVE:
                </div>
                <div className="pl-4 font-mono text-xs font-semibold text-mint">
                  Payload: {r.serve} ({r.rollout}% rollout)
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="space-y-2 rounded-xl bg-blue-surface p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-tertiary">Estimated Cohort Reach</span>
          <span className="font-bold text-foreground tabular-nums">{integer.format(reach.devices)} devices</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-blue-hover">
          <div className="h-full rounded-full bg-tertiary transition-[width] duration-500" style={{ width: `${Math.min(100, reach.pctOfMau * 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-tertiary">
          <span>{(reach.pctOfMau * 100).toFixed(1)}% of monthly active users</span>
          <span className="font-semibold text-foreground">{blast}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div role="radiogroup" aria-label="SDK language" className="flex rounded-lg bg-foreground/[0.05] p-0.5">
            {(["swift", "kotlin"] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                className={cn(
                  "h-6 rounded-md px-2.5 text-[11px] font-semibold capitalize",
                  lang === l ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(snippet).then(() => setCopied(true), () => undefined)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {copied ? <CheckIcon className="size-3 text-mint" /> : <CopyIcon className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-primary p-3 font-mono text-[11px] leading-relaxed text-mint-border">{snippet}</pre>
      </div>
    </section>
  )
}
