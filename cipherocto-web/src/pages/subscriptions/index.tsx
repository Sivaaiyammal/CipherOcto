import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronDownIcon, DownloadIcon, PlusIcon, ReceiptTextIcon } from "lucide-react"

import { PaywallVariants } from "@/components/subscriptions/paywall-variants"
import { ProductEditor, type EditorMode } from "@/components/subscriptions/product-editor"
import { ProductTable } from "@/components/subscriptions/product-table"
import { SandboxSimulator, TestReceiptSheet } from "@/components/subscriptions/sandbox-tools"
import { CohortRetention, SmartDunning, StoreGateways } from "@/components/subscriptions/store-telemetry"
import { SubscriptionKpis } from "@/components/subscriptions/sub-kpis"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApps } from "@/data/apps-context"
import { useAuth } from "@/data/auth-context"
import {
  KIND_LABEL,
  SEED_PAYWALLS,
  SEED_PRODUCTS,
  seedEvents,
  STORE_LABEL,
  type PaywallVariant,
  type Product,
  type StoreEvent,
  type StoreEventType,
} from "@/data/subscriptions"

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const actionBtn =
  "flex h-10 items-center gap-1.5 rounded-xl bg-foreground/[0.04] px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.08]"

export default function SubscriptionsPage() {
  const { can } = useAuth()
  const canWrite = can("subscriptions:write")
  const { apps } = useApps()
  const [searchParams, setSearchParams] = useSearchParams()
  const appParam = searchParams.get("app")
  const scope = appParam && apps.some((a) => a.id === appParam) ? appParam : "all"
  const setScope = (v: string) =>
    setSearchParams(
      (p) => {
        if (v === "all") p.delete("app")
        else p.set("app", v)
        return p
      },
      { replace: true }
    )

  const [products, setProducts] = React.useState<Product[]>(SEED_PRODUCTS)
  const [paywalls, setPaywalls] = React.useState<PaywallVariant[]>(SEED_PAYWALLS)
  const [events, setEvents] = React.useState<StoreEvent[]>(() => seedEvents(Date.now()))
  const [editor, setEditor] = React.useState<{ open: boolean; mode: EditorMode; product: Product | null; key: number }>({
    open: false,
    mode: "create",
    product: null,
    key: 0,
  })
  const [receiptOpen, setReceiptOpen] = React.useState(false)

  const scopeApp = apps.find((a) => a.id === scope)
  const scoped = scope === "all" ? products : products.filter((p) => p.appId === scope)

  const openEditor = (mode: EditorMode, product: Product | null) => setEditor((e) => ({ open: true, mode, product, key: e.key + 1 }))

  const saveProduct = (p: Product) =>
    setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]))

  const promote = (v: PaywallVariant) =>
    setPaywalls((list) =>
      list.map((x) => (x.traffic === "trigger" ? x : x.id === v.id ? { ...x, traffic: 100, placement: "All placements" } : { ...x, traffic: 0 }))
    )

  const pushEvent = (e: Omit<StoreEvent, "id" | "at">) =>
    setEvents((list) => [{ ...e, id: `ev-${Date.now().toString(36)}-${list.length}`, at: Date.now() }, ...list].slice(0, 20))

  const simulate = (type: StoreEventType, userId: string) => pushEvent({ type, label: `${userId} · ${type}`, simulated: true })

  const exportCsv = () => {
    const header = ["App", "Product", "Product ID", "Type", "Price (USD)", "Term", "Stores", "Status", "Count", "MRR (USD)", "Trial"]
    const rows = scoped.map((p) => [
      apps.find((a) => a.id === p.appId)?.name ?? p.appId,
      p.name,
      p.productId,
      KIND_LABEL[p.kind],
      p.price.toFixed(2),
      p.term,
      p.stores.map((s) => STORE_LABEL[s]).join(" / "),
      p.status,
      p.count,
      p.mrr,
      p.trial,
    ])
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `subscriptions-${scopeApp?.id ?? "all"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header & actions */}
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Subscriptions &amp; In-App Purchases</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold tracking-wider text-mint uppercase">
              <span className="size-1.5 rounded-full bg-stream-mrr motion-safe:animate-pulse" />
              Store Sync: Live &amp; Healthy (99.98% Ack Rate)
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Manage SKUs, price points and paywalls across the App Store, Google Play and Stripe — with real-time server notifications and
            entitlement sync.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-10 items-center gap-2 rounded-xl bg-card px-3.5 text-[13px] font-bold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]">
                <span className="size-2.5 rounded-full bg-stream-mrr" />
                {scopeApp?.name ?? "All Apps"} (All Storefronts)
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>App context</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={scope} onValueChange={setScope}>
                <DropdownMenuRadioItem value="all">All apps</DropdownMenuRadioItem>
                {apps.map((a) => (
                  <DropdownMenuRadioItem key={a.id} value={a.id}>
                    {a.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => setReceiptOpen(true)} className={actionBtn}>
            <ReceiptTextIcon className="size-4" />
            Test Receipt
          </button>
          <button type="button" onClick={exportCsv} className={actionBtn}>
            <DownloadIcon className="size-4" />
            Export CSV
          </button>
          <button
            type="button"
            disabled={!canWrite} onClick={() => openEditor("create", null)}
            className="disabled:cursor-not-allowed disabled:opacity-40 flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-[13px] font-semibold text-secondary-foreground shadow-[var(--shadow-1)] hover:bg-secondary/90"
          >
            <PlusIcon className="size-4" />
            Create Product SKU
          </button>
        </div>
      </section>

      <SubscriptionKpis products={scoped} />

      <div className="grid grid-cols-1 items-start gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 @5xl/main:col-span-8">
          <ProductTable
            readOnly={!canWrite}
            key={scope}
            products={scoped}
            apps={apps}
            onEdit={(p) => openEditor("edit", p)}
            onPriceTest={(p) => openEditor("price-test", p)}
          />
          <PaywallVariants readOnly={!canWrite} variants={paywalls} onPromote={promote} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 @5xl/main:col-span-4">
          <StoreGateways events={events} onTestPing={() => pushEvent({ type: "TEST_PING", label: "Ack 200 · 3/3 gateways" })} />
          <CohortRetention />
          <SmartDunning />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <SandboxSimulator onSimulate={simulate} />
      </div>

      <ProductEditor
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        mode={editor.mode}
        product={editor.product}
        apps={apps}
        defaultAppId={scope === "all" ? null : scope}
        existingIds={products.map((p) => p.productId)}
        onSave={saveProduct}
      />
      <TestReceiptSheet open={receiptOpen} onOpenChange={setReceiptOpen} />
    </>
  )
}
