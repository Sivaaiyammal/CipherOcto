import { Link } from "react-router-dom"
import { ArrowUpIcon, CirclePlusIcon } from "lucide-react"

import type { PaywallVariant } from "@/data/subscriptions"
import { usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONE = {
  neutral: "bg-background",
  mint: "bg-mint-surface",
  lavender: "bg-background",
}

export function PaywallVariants({
  variants,
  onPromote,
  readOnly = false,
}: {
  readOnly?: boolean
  variants: PaywallVariant[]
  onPromote: (v: PaywallVariant) => void
}) {
  const live = variants.filter((v) => v.traffic === "trigger" || v.traffic > 0).length

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
            Dynamic Paywalls &amp; Placement Offerings
            <span className="rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-mint">{live} Live Variants</span>
          </h2>
          <p className="text-[13px] text-muted-foreground">Remote-configured paywalls with automated A/B traffic splitting and conversion telemetry.</p>
        </div>
        <Link to="/remote-config?app=habitocto" className="flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg bg-foreground/[0.04] px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.08] sm:self-auto">
          <CirclePlusIcon className="size-4" />
          New Paywall Variant
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 pt-1 @3xl/main:grid-cols-3">
        {variants.map((v) => {
          const trigger = v.traffic === "trigger"
          const leading = !trigger && v.traffic === 100
          return (
            <article key={v.id} className={cn("flex flex-col justify-between rounded-xl p-4 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]", TONE[v.tone])}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap",
                      trigger ? "bg-lavender-hover text-lavender" : v.traffic === 0 ? "bg-neutral-strong text-muted-foreground" : "bg-mint-border text-mint"
                    )}
                  >
                    {trigger ? "TRIGGER ONLY" : v.traffic === 0 ? "PAUSED" : `${v.traffic}% TRAFFIC`}
                  </span>
                  {v.winner && !leading ? (
                    <span className="rounded-full bg-stream-mrr px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-white">WINNER +{v.winner}%</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-mint">
                      <span className="size-1.5 rounded-full bg-stream-mrr" />
                      {trigger ? "Active Automation" : leading ? "Promoted" : v.traffic === 0 ? "Paused" : "Live"}
                    </span>
                  )}
                </div>
                <h3 className="text-base leading-6 font-bold text-foreground">{v.name}</h3>
                <p className="text-xs text-muted-foreground">{v.description}</p>
              </div>

              <div className="my-3 flex flex-col gap-2 rounded-lg bg-card p-3 shadow-[inset_0_1px_3px_rgba(15,23,42,0.06)]" aria-hidden="true">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">{v.mock.headline}</span>
                  {v.mock.ribbon && <span className="rounded bg-pink-hover px-1 text-[9px] font-bold text-pink">{v.mock.ribbon}</span>}
                </div>
                <div className={cn("grid gap-2", v.mock.options.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {v.mock.options.map((o) => (
                    <div key={o.label} className={cn("flex flex-col rounded p-2", o.highlight ? "bg-mint-hover" : "bg-neutral-strong opacity-60")}>
                      <span className="text-[11px] font-bold text-foreground">{o.label}</span>
                      <span className="text-[10px] font-semibold text-mint">{o.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="space-y-1.5 pt-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{trigger ? "Retained Users" : "Conv. Rate"}</dt>
                  <dd className={cn("flex items-center gap-1 font-bold whitespace-nowrap", v.winner ? "text-mint" : "text-foreground")}>
                    {v.conversion}%{trigger ? " Save Rate" : ""}
                    {v.winner && <ArrowUpIcon className="size-3" />}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{trigger ? "MRR Saved" : "MRR Run-rate"}</dt>
                  <dd className="font-bold whitespace-nowrap text-mint tabular-nums">
                    {usd.format(v.mrr)}
                    {trigger ? " / mo" : ""}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
                  <span>{trigger ? v.placement : `Placement: ${v.placement}`}</span>
                  {v.winner && !leading ? (
                    <button type="button" disabled={readOnly} onClick={() => onPromote(v)} className="disabled:cursor-not-allowed disabled:opacity-40 font-semibold whitespace-nowrap text-mint hover:underline">
                      Promote to 100% →
                    </button>
                  ) : (
                    <Link to="/remote-config?app=habitocto" className="font-semibold whitespace-nowrap text-foreground hover:underline">
                      {trigger ? "Configure Logic →" : "Edit UI JSON →"}
                    </Link>
                  )}
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
