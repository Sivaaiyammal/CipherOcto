import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PEOPLE, PROJECTS, SPRINT, STATUS_META, STATUS_ORDER, type ProjectKey, type Task } from "@/data/projects"

export type SprintSheetMode = "report" | "complete"

export function SprintSheet({
  open,
  onOpenChange,
  mode,
  tasks,
  closed,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: SprintSheetMode
  tasks: Task[]
  closed: number
  onComplete: () => void
}) {
  const openTasks = tasks.filter((t) => t.status !== "done")
  const byApp = (Object.keys(PROJECTS) as ProjectKey[]).map((k) => {
    const mine = tasks.filter((t) => t.project === k)
    return { key: k, total: mine.length, done: mine.filter((t) => t.status === "done").length }
  })
  const byPerson = PEOPLE.map((p) => ({ p, count: tasks.filter((t) => t.assignee === p.id && t.status !== "done").length })).filter((x) => x.count > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "report" ? `${SPRINT.name} Report` : `Complete ${SPRINT.name}`}</SheetTitle>
          <SheetDescription>
            {mode === "report"
              ? `${closed} of ${SPRINT.total} sprint tasks closed · ${SPRINT.range}`
              : "Closing the sprint archives the board. Unfinished cards go back to the backlog."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 text-[13px]">
          {mode === "complete" && (
            <p role="status" className="rounded-xl bg-amber-surface p-3 text-amber">
              {openTasks.length === 0
                ? "Every card on the board is done."
                : `${openTasks.length} unfinished card${openTasks.length === 1 ? "" : "s"} will move to Backlog / Triage.`}
            </p>
          )}

          <section>
            <h3 className="mb-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">By column</h3>
            <ul className="space-y-1">
              {STATUS_ORDER.map((s) => (
                <li key={s} className="flex justify-between rounded-lg bg-background p-2">
                  <span>{STATUS_META[s].label}</span>
                  <span className="font-bold tabular-nums">{tasks.filter((t) => t.status === s).length}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">By app</h3>
            <ul className="space-y-1">
              {byApp.map((a) => (
                <li key={a.key} className="flex justify-between rounded-lg bg-background p-2">
                  <span>{PROJECTS[a.key].label}</span>
                  <span className="font-bold tabular-nums">
                    {a.done} / {a.total} done
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">Open work by person</h3>
            <ul className="space-y-1">
              {byPerson.map(({ p, count }) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-background p-2">
                  <span>{p.name}</span>
                  <span className="font-bold tabular-nums">{count}</span>
                </li>
              ))}
              {byPerson.length === 0 && <li className="rounded-lg bg-background p-2 text-muted-foreground">No open work.</li>}
            </ul>
          </section>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {mode === "complete" ? "Cancel" : "Close"}
          </Button>
          {mode === "complete" && (
            <Button
              onClick={() => {
                onComplete()
                onOpenChange(false)
              }}
            >
              Complete sprint
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
