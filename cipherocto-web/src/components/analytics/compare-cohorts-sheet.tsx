import * as React from "react"

import { Field, SelectInput } from "@/components/register/fields"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DAYS, MONTHLY_COHORTS } from "@/data/analytics"
import { cn } from "@/lib/utils"

const OPTIONS = MONTHLY_COHORTS.map((c) => ({ value: c.id, label: c.label }))

export function CompareCohortsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [a, setA] = React.useState(MONTHLY_COHORTS[1].id) // Sep — v2.9.0 release
  const [b, setB] = React.useState(MONTHLY_COHORTS[2].id) // Aug — before release

  const ca = MONTHLY_COHORTS.find((c) => c.id === a)!
  const cb = MONTHLY_COHORTS.find((c) => c.id === b)!

  const deltas = DAYS.map((d, i) => {
    const va = ca.all[i]
    const vb = cb.all[i]
    return { day: d, a: va, b: vb, delta: va != null && vb != null ? Math.round((va - vb) * 10) / 10 : null }
  })
  const comparable = deltas.filter((d) => d.delta != null)
  const avg = comparable.length ? comparable.reduce((s, d) => s + (d.delta as number), 0) / comparable.length : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Compare Cohorts</SheetTitle>
          <SheetDescription>Retention difference, in percentage points, at each milestone.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="cmp-a" label="Cohort A">
              <SelectInput id="cmp-a" value={a} onChange={(e) => setA(e.target.value)} options={OPTIONS} />
            </Field>
            <Field id="cmp-b" label="Cohort B">
              <SelectInput id="cmp-b" value={b} onChange={(e) => setB(e.target.value)} options={OPTIONS} />
            </Field>
          </div>

          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
                <th className="rounded-l-lg px-3 py-2">Day</th>
                <th className="px-3 py-2 text-right">{ca.label}</th>
                <th className="px-3 py-2 text-right">{cb.label}</th>
                <th className="rounded-r-lg px-3 py-2 text-right">Δ pp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 tabular-nums">
              {deltas.map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-2 font-semibold">Day {d.day}</td>
                  <td className="px-3 py-2 text-right">{d.a == null ? "—" : `${d.a.toFixed(1)}%`}</td>
                  <td className="px-3 py-2 text-right">{d.b == null ? "—" : `${d.b.toFixed(1)}%`}</td>
                  <td className={cn("px-3 py-2 text-right font-bold", d.delta == null ? "text-muted-foreground" : d.delta >= 0 ? "text-mint" : "text-destructive")}>
                    {d.delta == null ? "—" : `${d.delta > 0 ? "+" : ""}${d.delta.toFixed(1)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p role="status" className="rounded-xl bg-mint-surface p-3 text-[13px] text-mint">
            {a === b
              ? "Pick two different cohorts to compare."
              : avg == null
                ? "These cohorts have no milestone in common yet."
                : `${ca.label} retains ${Math.abs(avg).toFixed(1)} pp ${avg >= 0 ? "better" : "worse"} than ${cb.label} on average across ${comparable.length} shared milestones.`}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
