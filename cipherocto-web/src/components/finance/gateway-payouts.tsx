import * as React from "react"
import { CheckIcon, CreditCardIcon, Loader2Icon, RefreshCwIcon, ShoppingBagIcon, SmartphoneIcon } from "lucide-react"

import { GATEWAYS, type Gateway, type GatewayId, type MoneyFormat } from "@/data/finance"
import { cn } from "@/lib/utils"

const ICON: Record<GatewayId, { icon: typeof SmartphoneIcon; tile: string }> = {
  apple: { icon: SmartphoneIcon, tile: "bg-neutral-strong text-foreground" },
  google: { icon: ShoppingBagIcon, tile: "bg-amber-surface text-amber" },
  stripe: { icon: CreditCardIcon, tile: "bg-blue-surface text-tertiary" },
}

const BADGE: Record<Gateway["badgeTone"], string> = {
  mint: "bg-mint-border text-mint",
  amber: "bg-amber-hover text-amber",
  blue: "bg-blue-hover text-tertiary",
}

type MatchState = "idle" | "running" | "done"

export function GatewayPayouts({ factor, fmt }: { factor: number; fmt: MoneyFormat }) {
  const [state, setState] = React.useState<MatchState>("idle")

  React.useEffect(() => {
    if (state !== "running") return
    const t = window.setTimeout(() => setState("done"), 1300)
    return () => window.clearTimeout(t)
  }, [state])

  const matched = GATEWAYS.filter((g) => g.settled)
  const matchedTotal = matched.reduce((s, g) => s + g.amount, 0) * factor

  return (
    <section className="flex min-w-0 flex-col justify-between rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Gateway Payouts</h2>
            <p className="text-xs text-muted-foreground">Automated platform settlement tracking</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-mint-border px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap text-mint">
            <span className="size-1.5 rounded-full bg-stream-mrr" />
            Live Sync
          </span>
        </header>

        <ul className="space-y-2">
          {GATEWAYS.map((g) => {
            const { icon: Icon, tile } = ICON[g.id]
            const isMatched = state === "done" && g.settled
            return (
              <li key={g.id} className="rounded-xl bg-background p-3 transition-colors hover:bg-foreground/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tile)}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.route}</p>
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", BADGE[g.badgeTone])}>{g.badge}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-foreground tabular-nums">{fmt(g.amount * factor, "cents")}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isMatched && <CheckIcon className="size-3.5 text-mint" aria-label="Matched to bank feed" />}
                    {isMatched ? "Matched to bank feed" : g.note}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-4 space-y-2">
        {state === "done" && (
          <p role="status" className="rounded-lg bg-mint-surface p-2.5 text-xs text-mint">
            <strong>{matched.length} of {GATEWAYS.length} payouts matched</strong> · {fmt(matchedTotal, "cents")} · $0.00 variance. Google Play
            will match once it settles.
          </p>
        )}
        <button
          type="button"
          disabled={state === "running"}
          onClick={() => setState("running")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground/[0.04] px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.08] disabled:opacity-70"
        >
          {state === "running" ? <Loader2Icon className="size-[18px] animate-spin text-mint" /> : <RefreshCwIcon className="size-[18px] text-mint" />}
          {state === "running" ? "Matching against bank feed…" : state === "done" ? "Run Bank Match Again" : "Run Automated Bank Match"}
        </button>
      </div>
    </section>
  )
}
