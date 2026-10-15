import * as React from "react"
import { PlusIcon } from "lucide-react"

import { TaskCard } from "@/components/projects/task-card"
import { PRIORITY_META, PROJECTS, STATUS_META, STATUS_ORDER, type Status, type Task } from "@/data/projects"
import { cn } from "@/lib/utils"

export type Grouping = "none" | "app" | "priority"

function group(tasks: Task[], by: Grouping) {
  if (by === "none") return [{ key: "all", label: "", tasks }]
  const map = new Map<string, { key: string; label: string; tasks: Task[] }>()
  for (const t of tasks) {
    const key = by === "app" ? t.project : t.priority
    const label = by === "app" ? PROJECTS[t.project].label : PRIORITY_META[t.priority].label
    if (!map.has(key)) map.set(key, { key, label, tasks: [] })
    map.get(key)!.tasks.push(t)
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function Board({
  tasks,
  grouping,
  compact,
  onOpen,
  onAdd,
  onMove,
  readOnly = false,
}: {
  readOnly?: boolean
  tasks: Task[]
  grouping: Grouping
  compact: boolean
  onOpen: (t: Task) => void
  onAdd: (status: Status) => void
  onMove: (id: string, status: Status) => void
}) {
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<Status | null>(null)

  return (
    <div className="grid grid-cols-1 items-start gap-5 px-4 lg:px-6 @3xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status]
        const col = tasks.filter((t) => t.status === status)
        return (
          <section
            key={status}
            aria-label={meta.label}
            onDragOver={(e) => {
              if (!dragId || readOnly) return
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              setOver(status)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === status ? null : o))
            }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData("text/plain") || dragId
              if (id) onMove(id, status)
              setDragId(null)
              setOver(null)
            }}
            className={cn(
              "flex min-h-40 flex-col rounded-2xl bg-foreground/[0.035] p-4 transition-shadow",
              over === status && "ring-2 ring-mint/40"
            )}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", meta.dot)} />
                <h3 className="truncate text-lg font-semibold text-foreground">{meta.label}</h3>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", meta.count)}>{col.length}</span>
              </div>
              <button
                type="button"
                aria-label={`Add task to ${meta.label}`}
                disabled={readOnly} onClick={() => onAdd(status)}
                className="disabled:cursor-not-allowed disabled:opacity-40 rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <PlusIcon className="size-[18px]" />
              </button>
            </header>

            <div className="flex flex-col gap-3">
              {group(col, grouping).map((g) => (
                <div key={g.key} className="flex flex-col gap-3">
                  {g.label && <p className="pt-1 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">{g.label}</p>}
                  {g.tasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      compact={compact}
                      readOnly={readOnly}
                      dragging={dragId === t.id}
                      onOpen={onOpen}
                      onAdvance={(task) => onMove(task.id, STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1])}
                      onDragStart={(task) => setDragId(task.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOver(null)
                      }}
                    />
                  ))}
                </div>
              ))}
              {col.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Nothing here — drop a card or add one.</p>}
              <button
                type="button"
                disabled={readOnly} onClick={() => onAdd(status)}
                className="disabled:cursor-not-allowed disabled:opacity-40 flex w-full items-center justify-center gap-1 rounded-xl bg-foreground/[0.045] py-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground"
              >
                <PlusIcon className="size-4" /> Add Card
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
