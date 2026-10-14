import * as React from "react"
import { DownloadIcon, SearchIcon } from "lucide-react"

import { net, visibleRows, type AppFinanceRow, type MoneyFormat, type StoreFilter } from "@/data/finance"
import { cn } from "@/lib/utils"

const TONE: Record<AppFinanceRow["tone"], string> = {
  blue: "bg-blue-surface text-tertiary",
  mint: "bg-mint-hover text-mint",
  lavender: "bg-lavender-hover text-lavender",
  amber: "bg-amber-hover text-amber",
  pink: "bg-pink-hover text-pink",
}

const FILTERS: { value: StoreFilter; label: string }[] = [
  { value: "all", label: "All Stores" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
]

const initials = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")

export function AppPerformance({
  scope,
  fmt,
  onExport,
}: {
  scope: string
  fmt: MoneyFormat
  onExport: (rows: AppFinanceRow[]) => void
}) {
  const [store, setStore] = React.useState<StoreFilter>("all")
  const [query, setQuery] = React.useState("")
  const rows = visibleRows(scope, store, query)

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="flex flex-col justify-between gap-3 @5xl/main:flex-row @5xl/main:items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">App Financial Performance &amp; Unit Economics</h2>
          <p className="text-xs text-muted-foreground">
            Net unit margins calculated after store commissions, customer churn allowances, and OpenAI compute allocations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-9 w-full items-center sm:w-56">
            <SearchIcon className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter apps by SKU…"
              aria-label="Filter apps"
              className="h-9 w-full rounded-xl bg-background pr-3 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-foreground/[0.04]"
            />
          </label>
          <div role="radiogroup" aria-label="Store" className="inline-flex rounded-xl bg-foreground/[0.05] p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={store === f.value}
                onClick={() => setStore(f.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap",
                  store === f.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onExport(rows)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-foreground/[0.05] px-3 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.09]"
          >
            <DownloadIcon className="size-4" />
            Export Table
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="px-4 py-3">Application &amp; SKU</th>
              <th className="px-4 py-3 text-right">Gross (30D)</th>
              <th className="px-4 py-3 text-right">Store Fee</th>
              <th className="px-4 py-3 text-right">Refunds</th>
              <th className="px-4 py-3 text-right">Infra &amp; AI</th>
              <th className="px-4 py-3 text-right">Net Contribution</th>
              <th className="px-4 py-3 text-center">LTV:CAC</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r) => {
              const n = net(r)
              return (
                <tr key={r.appId} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold", TONE[r.tone])}>{initials(r.name)}</span>
                      <div className="min-w-0">
                        <p className="font-bold whitespace-nowrap text-foreground">{r.name}</p>
                        <p className="text-xs whitespace-nowrap text-muted-foreground">
                          {r.sku} · {r.platformsLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold whitespace-nowrap tabular-nums">{fmt(r.gross, "cents")}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap text-muted-foreground tabular-nums">
                    -{fmt(r.fee, "cents")} <span className="text-xs text-mint">({Math.round((r.fee / r.gross) * 100)}%)</span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap text-muted-foreground tabular-nums">-{fmt(r.refunds, "cents")}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap text-muted-foreground tabular-nums">-{fmt(r.infra, "cents")}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">
                    <p className="font-bold text-mint">{fmt(n, "cents")}</p>
                    <p className="text-xs text-muted-foreground">{((n / r.gross) * 100).toFixed(1)}% Margin</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", r.ltvCac >= 4 ? "bg-mint-border text-mint" : "bg-amber-hover text-amber")}>
                      {r.ltvCac.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", r.status === "Settled" ? "bg-mint-border text-mint" : "bg-amber-hover text-amber")}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No apps match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
