import { DownloadIcon } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TAX_DOCS, type MoneyFormat } from "@/data/finance"
import { downloadFile, toCsv } from "@/lib/download"

export function TaxPackSheet({
  open,
  onOpenChange,
  fmt,
  factor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fmt: MoneyFormat
  factor: number
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>1099-K / Tax Pack</SheetTitle>
          <SheetDescription>Year-end documents for your accountant. Figures reflect the selected app scope.</SheetDescription>
        </SheetHeader>
        <ul className="space-y-3 overflow-y-auto p-4">
          {TAX_DOCS.map((d) => (
            <li key={d.id} className="space-y-3 rounded-xl bg-background p-4">
              <div>
                <p className="text-[13px] font-bold text-foreground">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.detail}</p>
              </div>
              <dl className="space-y-1 text-[13px]">
                {d.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-semibold text-foreground tabular-nums">
                      {k === "Transactions" ? Math.round(v * factor).toLocaleString("en-US") : fmt(v * factor)}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    `${d.id}-tax-pack.csv`,
                    toCsv([["Document", d.title], ["Detail", d.detail], ...d.rows.map(([k, v]) => [k, Math.round(v * factor * 100) / 100])])
                  )
                }
                className="flex h-8 items-center gap-1.5 rounded-lg bg-card px-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
              >
                <DownloadIcon className="size-4" />
                Download CSV
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
