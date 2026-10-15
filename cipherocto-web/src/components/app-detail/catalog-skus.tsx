import * as React from "react"
import { Link } from "react-router-dom"
import {
  CalendarDaysIcon,
  CalendarSyncIcon,
  DownloadIcon,
  FilterIcon,
  FlaskConicalIcon,
  InfinityIcon,
  PaletteIcon,
  PlayIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CatalogSku, SkuKind } from "@/data/app-insights"
import { cn } from "@/lib/utils"

const ICONS = {
  annual: CalendarDaysIcon,
  monthly: CalendarSyncIcon,
  lifetime: InfinityIcon,
  pack: PaletteIcon,
}

const TONE = {
  mint: "bg-mint-hover text-mint",
  blue: "bg-blue-hover text-tertiary",
  amber: "bg-amber-surface text-amber",
  pink: "bg-pink-hover text-pink",
}

const FILTERS: { value: SkuKind | "all"; label: string }[] = [
  { value: "all", label: "All products" },
  { value: "subscription", label: "Subscriptions" },
  { value: "non-consumable", label: "Non-consumables" },
  { value: "consumable", label: "Consumables" },
]

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function exportCatalog(appName: string, skus: CatalogSku[]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [
    ["Product", "Product ID", "Type", "Price (USD)", "Volume", "Monthly Revenue (USD)", "Revenue Share %"],
    ...skus.map((s) => [
      s.name,
      s.id,
      s.kind,
      s.price ?? "",
      s.volume,
      s.monthlyRevenue === null ? "" : s.monthlyRevenue.toFixed(2),
      s.revenueShare === null ? "" : s.revenueShare.toFixed(1),
    ]),
  ]
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${appName.toLowerCase().replace(/\s+/g, "-")}-catalog.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function CatalogSkus({
  appName,
  skus,
  loading = false,
  error = null,
  canSeeBilling = true,
  notificationsConfigured = null,
}: {
  appName: string
  skus: CatalogSku[]
  loading?: boolean
  error?: string | null
  /** False when the role can't read subscription data. */
  canSeeBilling?: boolean
  notificationsConfigured?: boolean | null
}) {
  const [filter, setFilter] = React.useState<SkuKind | "all">("all")
  const visible = skus.filter((s) => filter === "all" || s.kind === filter)
  // Highlight the top earner only once revenue is actually known.
  const topId = skus.some((s) => s.monthlyRevenue !== null)
    ? skus.reduce((a, b) => ((b.monthlyRevenue ?? 0) > (a.monthlyRevenue ?? 0) ? b : a)).id
    : null
  const emptyMessage = !canSeeBilling
    ? "Your role can't view subscription products."
    : loading
      ? "Loading products…"
      : error
        ? error
        : skus.length === 0
          ? "No Google Play products are mapped to this app yet."
          : "No products match this filter."

  return (
    <section className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-1)]">
      <header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between lg:px-6 lg:pt-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            <span className="flex size-6 items-center justify-center rounded-md bg-mint-hover text-mint [&_svg]:size-3.5">
              <CalendarDaysIcon />
            </span>
            In-App Monetization &amp; Catalog SKUs
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Active subscriptions, non-consumables, and micro-transaction tiers.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-9 rounded-[10px] bg-foreground/[0.04] px-3 text-[13px] font-semibold hover:bg-foreground/[0.08]",
                  filter !== "all" && "bg-mint-hover text-mint hover:bg-mint-border/60"
                )}
              >
                <FilterIcon />
                {filter === "all" ? "Filter" : FILTERS.find((f) => f.value === filter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Product type</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as SkuKind | "all")}>
                {FILTERS.map((f) => (
                  <DropdownMenuRadioItem key={f.value} value={f.value}>
                    {f.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            disabled={skus.length === 0}
            onClick={() => exportCatalog(appName, skus)}
            className="h-9 rounded-[10px] bg-foreground/[0.04] px-3 text-[13px] font-semibold hover:bg-foreground/[0.08]"
          >
            <DownloadIcon />
            Export Catalog
          </Button>
        </div>
      </header>

      <Table className="min-w-[600px]">
        <TableHeader className="bg-background">
          <TableRow className="hover:bg-transparent">
            {[
              ["Product Name & ID", "pl-5 lg:pl-6"],
              ["Tier & Price", ""],
              ["Subscribers / Volume", ""],
              ["Monthly Revenue", "text-right"],
              ["Actions", "pr-5 text-right lg:pr-6"],
            ].map(([label, cls]) => (
              <TableHead
                key={label}
                className={cn("h-10 text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase", cls)}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="h-24 px-5 text-center text-[13px] text-muted-foreground lg:px-6">
                {emptyMessage}{" "}
                {canSeeBilling && skus.length === 0 && !loading && !error && (
                  <Link to="/billing" className="font-semibold text-mint hover:underline">
                    Map products in Billing Setup →
                  </Link>
                )}
              </TableCell>
            </TableRow>
          )}
          {visible.map((sku) => {
            const Icon = ICONS[sku.icon]
            return (
              <TableRow key={sku.id} className="h-16 hover:bg-[#f8fafc]">
                <TableCell className="pl-5 lg:pl-6">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4.5", TONE[sku.tone])}>
                      <Icon />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[13px] font-bold text-foreground">{sku.name}</p>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        {sku.id}
                        {sku.apple && <SmartphoneIcon className="size-3 text-foreground/70" aria-label="Apple App Store" />}
                        {sku.android && <PlayIcon className="size-3 text-mint" aria-label="Google Play" />}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="leading-tight">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {sku.price === null ? "—" : money.format(sku.price)}
                    {sku.period && <span className="text-xs text-muted-foreground">/{sku.period}</span>}
                  </p>
                  <p className={cn("text-[11px] font-semibold", sku.kind === "non-consumable" ? "text-amber" : sku.icon === "annual" ? "text-mint" : "text-muted-foreground")}>
                    {sku.priceNote}
                  </p>
                </TableCell>
                <TableCell className="leading-tight">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{sku.volume}</p>
                  <p className={cn("text-[11px]", sku.volumeNote.startsWith("+") && sku.kind === "subscription" ? "font-semibold text-mint" : "text-muted-foreground")}>
                    {sku.volumeNote}
                  </p>
                </TableCell>
                <TableCell className="text-right leading-tight">
                  <p className="font-mono text-sm font-bold text-foreground">{sku.monthlyRevenue === null ? "—" : money.format(sku.monthlyRevenue)}</p>
                  <span
                    className={cn(
                      "mt-0.5 inline-block rounded px-1.5 text-[10px] font-bold tabular-nums",
                      sku.id === topId ? "bg-mint-hover text-mint" : "bg-neutral-strong text-foreground/70"
                    )}
                  >
                    {sku.revenueShare === null ? "—" : `${sku.revenueShare.toFixed(1)}% of Rev`}
                  </span>
                </TableCell>
                <TableCell className="pr-5 text-right lg:pr-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    title="Prices are managed in the Play Console."
                    className="size-8 rounded-lg text-muted-foreground"
                    aria-label={`Edit pricing for ${sku.name}`}
                  >
                    <SlidersHorizontalIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    title="Sandbox testing isn't connected yet."
                    className="size-8 rounded-lg text-muted-foreground"
                    aria-label={`Test ${sku.name} in sandbox`}
                  >
                    <FlaskConicalIcon />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <footer className="flex flex-col gap-2 border-t border-border/70 px-5 pb-4 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <span className="flex items-center gap-1.5">
          <RefreshCwIcon className="size-3.5 text-mint" />
          {notificationsConfigured === null
            ? "Real-time Developer Notifications (RTDN) status unavailable"
            : notificationsConfigured
              ? "Real-time Developer Notifications (RTDN) active"
              : "Real-time Developer Notifications (RTDN) not configured"}
        </span>
        <Link to="/billing" className="font-semibold text-mint hover:underline">
          View subscription events →
        </Link>
      </footer>
    </section>
  )
}
