import { RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { describeValue, diffParams, relativeTime, type AuditEntry, type RemoteParam } from "@/data/remote-config"
import { cn } from "@/lib/utils"

const CHANGE_TONE = {
  added: "bg-mint-hover text-mint",
  removed: "bg-pink-hover text-pink",
  changed: "bg-amber-hover text-amber",
}

export function CompareEnvsSheet({
  open,
  onOpenChange,
  production,
  staging,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  production: RemoteParam[]
  staging: RemoteParam[]
}) {
  const diffs = diffParams(production, staging)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Compare Environments</SheetTitle>
          <SheetDescription>Working values in Staging compared with Production (including unpublished drafts).</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 overflow-y-auto p-4">
          {diffs.length === 0 && <p className="text-sm text-muted-foreground">Staging and Production are identical.</p>}
          {diffs.map((d) => (
            <div key={d.key + d.change} className="space-y-1.5 rounded-xl bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-[13px] font-semibold text-foreground">{d.key}</code>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", CHANGE_TONE[d.change])}>
                  {d.change === "added" ? "Staging only" : d.change === "removed" ? "Production only" : "Differs"}
                </span>
              </div>
              {d.before && (
                <p className="font-mono text-[11px] break-all text-muted-foreground">
                  <span className="font-sans font-semibold text-foreground">Prod:</span> {describeValue(d.before)}
                </p>
              )}
              {d.after && (
                <p className="font-mono text-[11px] break-all text-muted-foreground">
                  <span className="font-sans font-semibold text-foreground">Staging:</span> {describeValue(d.after)}
                </p>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AuditLogSheet({
  open,
  onOpenChange,
  entries,
  onRevert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: AuditEntry[]
  onRevert: (entry: AuditEntry) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Audit Log</SheetTitle>
          <SheetDescription>Every published config build, newest first. Reverting publishes that snapshot as a new build.</SheetDescription>
        </SheetHeader>
        <ol className="space-y-2 overflow-y-auto p-4">
          {entries.map((e, i) => (
            <li key={e.id} className="space-y-1 rounded-xl bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  Config Build #v{e.build}{" "}
                  <span className="rounded bg-neutral-strong px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">{e.env}</span>
                </span>
                <span className="text-xs text-muted-foreground">{relativeTime(e.at)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {e.summary} — by <span className="font-semibold text-foreground">{e.by}</span>
              </p>
              {i > 0 && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onRevert(e)}>
                  <RotateCcwIcon />
                  Revert to v{e.build}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
