import * as React from "react"
import { ChevronDownIcon, CreditCardIcon, PlayIcon, ScaleIcon, SearchIcon, SlidersHorizontalIcon, SmartphoneIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { APP_TONE_TILE, type PortfolioApp } from "@/data/apps"
import { money, perMonth, STORE_LABEL, TERM_LABEL, type Product, type Store } from "@/data/subscriptions"
import { integer, usd } from "@/lib/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 5
type Tab = "all" | "auto-renewable" | "one-time" | "promo"

const TABS: { value: Tab; label: string; match: (p: Product) => boolean }[] = [
  { value: "all", label: "All Products", match: () => true },
  { value: "auto-renewable", label: "Auto-Renewable", match: (p) => p.kind === "auto-renewable" },
  { value: "one-time", label: "One-Time IAP", match: (p) => p.kind === "non-consumable" || p.kind === "consumable" },
  { value: "promo", label: "Promos", match: (p) => p.kind === "promo" },
]

const STORE_ICON: Record<Store, React.ElementType> = { apple: SmartphoneIcon, google: PlayIcon, stripe: CreditCardIcon }

const BADGE_TONE: Record<Product["kind"], string> = {
  "auto-renewable": "bg-neutral-strong text-muted-foreground",
  "non-consumable": "bg-lavender-hover text-lavender",
  consumable: "bg-foreground/[0.06] text-muted-foreground",
  promo: "bg-amber-hover text-amber",
}

const STATUS: Record<Product["status"], { label: string; dot: string; text: string }> = {
  active: { label: "Active / Approved", dot: "bg-stream-mrr", text: "text-mint" },
  review: { label: "In Store Review", dot: "bg-amber", text: "text-amber" },
  draft: { label: "Draft (not submitted)", dot: "bg-subtle-foreground", text: "text-muted-foreground" },
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function ProductTable({
  products,
  apps,
  onEdit,
  onPriceTest,
  readOnly = false,
}: {
  readOnly?: boolean
  products: Product[]
  apps: PortfolioApp[]
  onEdit: (p: Product) => void
  onPriceTest: (p: Product) => void
}) {
  const [tab, setTab] = React.useState<Tab>("all")
  const [query, setQuery] = React.useState("")
  const [store, setStore] = React.useState<Store | "all">("all")
  const [page, setPage] = React.useState(1)

  const q = query.trim().toLowerCase()
  const tabbed = products.filter(TABS.find((t) => t.value === tab)!.match)
  const filtered = tabbed.filter(
    (p) => (store === "all" || p.stores.includes(store)) && (!q || p.name.toLowerCase().includes(q) || p.productId.includes(q))
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const reset = () => setPage(1)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="flex flex-col justify-between gap-3 @7xl/main:flex-row @7xl/main:items-center">
        <div role="radiogroup" aria-label="Product type" className="inline-flex max-w-full overflow-x-auto rounded-lg bg-foreground/[0.05] p-1 text-[13px] font-semibold text-muted-foreground [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={tab === t.value}
              onClick={() => {
                setTab(t.value)
                reset()
              }}
              className={cn("rounded-md px-3 py-1.5 whitespace-nowrap", tab === t.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "hover:text-foreground")}
            >
              {t.label} ({products.filter(t.match).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="relative flex h-8 w-full items-center sm:w-48">
            <SearchIcon className="absolute left-2.5 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                reset()
              }}
              placeholder="Filter SKUs…"
              aria-label="Filter SKUs"
              className="h-8 w-full rounded-lg bg-background pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-foreground/[0.05]"
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-background px-3 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.06]">
                {store === "all" ? "All Stores" : STORE_LABEL[store]}
                <ChevronDownIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={store}
                onValueChange={(v) => {
                  setStore(v as Store | "all")
                  reset()
                }}
              >
                <DropdownMenuRadioItem value="all">All Stores</DropdownMenuRadioItem>
                {(Object.keys(STORE_LABEL) as Store[]).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>
                    {STORE_LABEL[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="rounded-l-lg px-4 py-3">Product &amp; SKU</th>
              <th className="hidden px-3 py-3 @7xl/main:table-cell">Stores &amp; Status</th>
              <th className="px-3 py-3">Price &amp; Term</th>
              <th className="px-3 py-3">Subscribers &amp; MRR</th>
              <th className="hidden px-3 py-3 @7xl/main:table-cell">Trial &amp; Rules</th>
              <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((p) => {
              const app = apps.find((a) => a.id === p.appId)
              const st = STATUS[p.status]
              const recurring = p.term !== "once"
              return (
                <tr key={p.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold", app ? APP_TONE_TILE[app.tone] : "bg-neutral-strong")}>
                        {initials(p.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 font-semibold text-foreground">
                          <span>{p.name}</span>
                          {p.badge && <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", p.badge === "BESTSELLER" ? "bg-mint-border text-mint" : BADGE_TONE[p.kind])}>{p.badge}</span>}
                          {p.priceTest && <span className="rounded bg-blue-hover px-1.5 py-0.5 text-[10px] font-bold text-tertiary">PRICE TEST</span>}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{p.productId}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] @7xl/main:hidden">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className={cn("size-2 rounded-full", st.dot)} />
                            <span className={cn("font-bold tracking-[0.04em]", st.text)}>{st.label}</span>
                          </span>
                          <span className="whitespace-nowrap text-muted-foreground">· {p.stores.map((s) => STORE_LABEL[s]).join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3.5 @7xl/main:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", st.dot)} />
                      <span className={cn("text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", st.text)}>{st.label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                      {p.stores.map((s) => {
                        const Icon = STORE_ICON[s]
                        return <Icon key={s} className="size-3.5" aria-label={STORE_LABEL[s]} />
                      })}
                      {p.storefronts && <span className="text-[11px]">{p.storefronts} Storefronts</span>}
                      {p.stores.length === 1 && p.stores[0] === "stripe" && <span className="text-xs">Stripe B2B Portal</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-bold whitespace-nowrap text-foreground tabular-nums">
                      {money(p.price)} {TERM_LABEL[p.term]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.priceTest
                        ? `B: ${money(p.priceTest.price)} · ${p.priceTest.split}% traffic`
                        : p.term === "yr"
                          ? `${money(perMonth(p))} / month amortized`
                          : p.term === "mo"
                            ? "Billed monthly"
                            : p.kind === "consumable"
                              ? "Consumable pack"
                              : "One-time purchase"}
                    </div>
                    <span className="mt-1 inline-block rounded-full bg-mint-surface px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-mint @7xl/main:hidden">{p.trial}</span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums">
                    <div className="font-semibold text-foreground">
                      {integer.format(p.count)} {p.countLabel}
                    </div>
                    <div className={cn("text-xs font-semibold", recurring ? "text-mint" : "text-muted-foreground")}>
                      {usd.format(p.mrr)} {recurring ? "MRR" : p.kind === "consumable" ? "Volume" : "/mo amortized"}
                    </div>
                  </td>
                  <td className="hidden px-3 py-3.5 @7xl/main:table-cell">
                    <span className="inline-block rounded-full bg-mint-surface px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-mint">{p.trial}</span>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.trialNote}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" disabled={readOnly} onClick={() => onPriceTest(p)} title="A/B Test Price" aria-label={`A/B test price for ${p.name}`} className="disabled:cursor-not-allowed disabled:opacity-40 rounded-md p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                        <ScaleIcon className="size-4" />
                      </button>
                      <button type="button" disabled={readOnly} onClick={() => onEdit(p)} title="Edit SKU" aria-label={`Edit ${p.name}`} className="disabled:cursor-not-allowed disabled:opacity-40 rounded-md p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                        <SlidersHorizontalIcon className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 pt-2 text-xs text-muted-foreground sm:flex-row">
        <span className="tabular-nums">
          Showing {visible.length} of {filtered.length} configured products across iOS, Android, and Web
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-foreground/[0.06] disabled:opacity-40">
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === current ? "page" : undefined}
              onClick={() => setPage(n)}
              className={cn("rounded px-2 py-1", n === current ? "font-semibold text-foreground" : "hover:bg-background")}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)} className="rounded bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-foreground/[0.06] disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
