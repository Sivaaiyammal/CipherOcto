import * as React from "react"

import { Field, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { PortfolioApp } from "@/data/apps"
import { PRODUCT_ID_RE, STORE_LABEL, type Product, type ProductKind, type Store, type Term } from "@/data/subscriptions"

export type EditorMode = "create" | "edit" | "price-test"

const KINDS: { value: ProductKind; label: string }[] = [
  { value: "auto-renewable", label: "Auto-renewable subscription" },
  { value: "non-consumable", label: "Non-consumable (lifetime)" },
  { value: "consumable", label: "Consumable" },
  { value: "promo", label: "Promotional offer" },
]

const TERMS: { value: Term; label: string }[] = [
  { value: "wk", label: "Weekly" },
  { value: "mo", label: "Monthly" },
  { value: "yr", label: "Annual" },
  { value: "once", label: "One-time" },
]

export function ProductEditor({
  open,
  onOpenChange,
  mode,
  product,
  apps,
  defaultAppId,
  existingIds,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: EditorMode
  product: Product | null
  apps: PortfolioApp[]
  defaultAppId: string | null
  existingIds: string[]
  onSave: (p: Product) => void
}) {
  const [form, setForm] = React.useState(() => ({
    appId: product?.appId ?? defaultAppId ?? apps[0]?.id ?? "",
    name: product?.name ?? "",
    productId: product?.productId ?? "",
    kind: product?.kind ?? ("auto-renewable" as ProductKind),
    price: product ? String(product.price) : "",
    term: product?.term ?? ("mo" as Term),
    trial: product?.trial ?? "",
    stores: product?.stores ?? (["apple", "google"] as Store[]),
    testPrice: product?.priceTest ? String(product.priceTest.price) : "",
    testSplit: product?.priceTest?.split ?? 50,
  }))
  const [attempted, setAttempted] = React.useState(false)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const price = Number(form.price)
  const testPrice = Number(form.testPrice)
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = "Name the product."
  if (!PRODUCT_ID_RE.test(form.productId)) errors.productId = "Use reverse-DNS, e.g. com.company.app.pro.annual."
  else if (existingIds.includes(form.productId) && form.productId !== product?.productId) errors.productId = "That product ID is already used."
  if (!(price > 0) || price > 9999) errors.price = "Enter a price between $0.01 and $9,999."
  if (form.kind === "auto-renewable" && form.term === "once") errors.term = "Subscriptions need a billing period."
  if (form.stores.length === 0) errors.stores = "Pick at least one store."
  if (mode === "price-test" && (!(testPrice > 0) || testPrice === price)) errors.testPrice = "Variant B needs a different, positive price."
  const shown = attempted ? errors : {}

  const save = () => {
    setAttempted(true)
    if (Object.keys(errors).length) return
    onSave({
      ...(product ?? {
        id: `sku-${Date.now().toString(36)}`,
        status: "draft",
        count: 0,
        countLabel: form.kind === "consumable" ? "orders" : form.kind === "non-consumable" ? "buyers" : "subs",
        mrr: 0,
        trialNote: "Awaiting store approval",
      }),
      appId: form.appId,
      name: form.name.trim(),
      productId: form.productId,
      kind: form.kind,
      price: Math.round(price * 100) / 100,
      term: form.kind === "non-consumable" || form.kind === "consumable" ? "once" : form.term,
      trial: form.trial.trim() || "No Trial",
      stores: form.stores,
      priceTest: mode === "price-test" ? { price: Math.round(testPrice * 100) / 100, split: form.testSplit } : product?.priceTest,
    } as Product)
    onOpenChange(false)
  }

  const title = mode === "create" ? "Create Product SKU" : mode === "price-test" ? `A/B Test Price — ${product?.name}` : `Edit ${product?.name}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {mode === "price-test"
              ? "Serve a second price to a share of new purchasers. Existing subscribers keep their price."
              : "New SKUs start as drafts until they're approved by each store."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {mode !== "price-test" && (
            <>
              <Field id="sku-app" label="App" required>
                <SelectInput id="sku-app" value={form.appId} onChange={(e) => set("appId", e.target.value)} options={apps.map((a) => ({ value: a.id, label: a.name }))} />
              </Field>
              <Field id="sku-name" label="Display Name" required error={shown.name}>
                <TextInput id="sku-name" value={form.name} placeholder="HabitOcto Pro Annual" onChange={(e) => set("name", e.target.value)} error={shown.name} />
              </Field>
              <Field id="sku-id" label="Product ID" required error={shown.productId} hint="Must match the product ID in App Store Connect and Play Console.">
                <TextInput id="sku-id" mono value={form.productId} placeholder="com.octo.habits.pro.annual" onChange={(e) => set("productId", e.target.value.trim().toLowerCase())} error={shown.productId} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="sku-kind" label="Type" required>
                  <SelectInput id="sku-kind" value={form.kind} onChange={(e) => set("kind", e.target.value as ProductKind)} options={KINDS} />
                </Field>
                <Field id="sku-term" label="Billing Period" required error={shown.term}>
                  <SelectInput id="sku-term" value={form.term} onChange={(e) => set("term", e.target.value as Term)} options={TERMS} disabled={form.kind === "non-consumable" || form.kind === "consumable"} />
                </Field>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field id="sku-price" label={mode === "price-test" ? "Variant A (current)" : "Price (USD)"} required error={shown.price}>
              <TextInput id="sku-price" mono inputMode="decimal" value={form.price} placeholder="9.99" onChange={(e) => set("price", e.target.value)} error={shown.price} disabled={mode === "price-test"} />
            </Field>
            {mode === "price-test" ? (
              <Field id="sku-test" label="Variant B price" required error={shown.testPrice}>
                <TextInput id="sku-test" mono inputMode="decimal" value={form.testPrice} placeholder="44.99" onChange={(e) => set("testPrice", e.target.value)} error={shown.testPrice} />
              </Field>
            ) : (
              <Field id="sku-trial" label="Trial / Intro Offer">
                <TextInput id="sku-trial" value={form.trial} placeholder="7-Day Free Trial" onChange={(e) => set("trial", e.target.value)} />
              </Field>
            )}
          </div>
          {mode === "price-test" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px] font-semibold text-foreground">
                <label htmlFor="sku-split">Traffic to Variant B</label>
                <span className="tabular-nums">{form.testSplit}%</span>
              </div>
              <input id="sku-split" type="range" min={5} max={95} step={5} value={form.testSplit} onChange={(e) => set("testSplit", Number(e.target.value))} className="w-full accent-[var(--stream-mrr)]" />
            </div>
          )}
          {mode !== "price-test" && (
            <fieldset>
              <legend className="mb-1.5 text-[13px] font-semibold text-foreground">Stores</legend>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(STORE_LABEL) as Store[]).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-[13px]">
                    <Checkbox
                      checked={form.stores.includes(s)}
                      onCheckedChange={(v) => set("stores", v === true ? [...form.stores, s] : form.stores.filter((x) => x !== s))}
                      className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    {STORE_LABEL[s]}
                  </label>
                ))}
              </div>
              {shown.stores && <p className="mt-1 text-xs font-medium text-destructive">{shown.stores}</p>}
            </fieldset>
          )}
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{mode === "create" ? "Create SKU" : mode === "price-test" ? "Start Price Test" : "Save Changes"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
