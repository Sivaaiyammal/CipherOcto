import { Avatar, ProjectChip } from "@/components/projects/task-card"
import {
  EPICS,
  PEOPLE,
  PRIORITY_META,
  PROJECTS,
  SPRINT,
  STATUS_META,
  STATUS_ORDER,
  type EpicStatus,
  type Status,
  type Task,
} from "@/data/projects"
import { cn } from "@/lib/utils"

// ── List ───────────────────────────────────────────────────────────────────

export function ListView({ tasks, onOpen, onStatus }: { tasks: Task[]; onOpen: (t: Task) => void; onStatus: (id: string, s: Status) => void }) {
  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-x-auto rounded-2xl bg-card p-2 shadow-[var(--shadow-1)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="px-4 py-3">Task</th>
              <th className="px-3 py-3">App</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Assignee</th>
              <th className="px-4 py-3 text-right">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-foreground/[0.02]">
                <td className="max-w-md px-4 py-3">
                  <button type="button" onClick={() => onOpen(t)} className={cn("text-left font-semibold text-foreground hover:underline", t.status === "done" && "line-through")}>
                    {t.title}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <ProjectChip task={t} />
                </td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", PRIORITY_META[t.priority].className)}>{PRIORITY_META[t.priority].label}</span>
                </td>
                <td className="px-3 py-3">
                  <select
                    value={t.status}
                    aria-label={`Status for ${t.title}`}
                    onChange={(e) => onStatus(t.id, e.target.value as Status)}
                    className="h-8 rounded-lg bg-background px-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Avatar id={t.assignee} />
                    {PEOPLE.find((p) => p.id === t.assignee)?.name}
                  </span>
                </td>
                <td className={cn("px-4 py-3 text-right whitespace-nowrap", t.due.urgent ? "font-semibold text-destructive" : "text-muted-foreground")}>{t.due.label}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Gantt ──────────────────────────────────────────────────────────────────

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

export function GanttView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const days = Array.from({ length: SPRINT.days }, (_, i) => {
    const d = new Date(SPRINT.start)
    d.setDate(d.getDate() + i)
    return d
  })
  const lastDay = SPRINT.days - 1

  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-x-auto rounded-2xl bg-card p-4 shadow-[var(--shadow-1)]">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[220px_1fr] gap-3 pb-2">
            <span className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">Task</span>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${SPRINT.days}, minmax(0, 1fr))` }}>
              {days.map((d, i) => (
                <span
                  key={i}
                  className={cn(
                    "border-l border-border/60 px-1 text-center text-[10px] font-semibold",
                    i === SPRINT.today ? "rounded-t bg-mint-surface text-mint" : "text-muted-foreground"
                  )}
                >
                  {i === 0 || d.getDate() === 1 ? dayFmt.format(d) : d.getDate()}
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-1.5">
            {tasks.map((t) => {
              const clippedStart = Math.min(t.startDay, lastDay)
              const visibleEnd = Math.min(t.endDay, lastDay)
              const beyond = t.startDay > lastDay
              const left = (clippedStart / SPRINT.days) * 100
              const width = (Math.max(1, visibleEnd - clippedStart + 1) / SPRINT.days) * 100
              return (
                <li key={t.id} className="grid grid-cols-[220px_1fr] items-center gap-3">
                  <button type="button" onClick={() => onOpen(t)} className="truncate text-left text-[13px] font-semibold text-foreground hover:underline">
                    {t.title}
                  </button>
                  <div className="relative h-7 rounded bg-foreground/[0.03]">
                    <span className="absolute inset-y-0 w-px bg-mint/60" style={{ left: `${((SPRINT.today + 0.5) / SPRINT.days) * 100}%` }} aria-hidden="true" />
                    {beyond ? (
                      <span className="absolute inset-y-0 right-2 flex items-center text-[11px] font-semibold text-muted-foreground">Starts after sprint · due {t.due.label} →</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpen(t)}
                        title={`${t.title} — due ${t.due.label}`}
                        className={cn(
                          "absolute inset-y-1 flex items-center overflow-hidden rounded-md px-2 text-[10px] font-bold text-white",
                          PROJECTS[t.project].bar,
                          t.status === "done" && "opacity-60",
                          t.endDay > lastDay && "rounded-r-none"
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className="truncate">{STATUS_META[t.status].label}</span>
                        {t.endDay > lastDay && <span className="ml-auto pl-1">→ {t.due.label}</span>}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {tasks.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No tasks match your filters.</p>}
        </div>
      </div>
    </div>
  )
}

// ── Roadmap ────────────────────────────────────────────────────────────────

const LANES: { status: EpicStatus; label: string; tone: string }[] = [
  { status: "flight", label: "In flight", tone: "bg-mint-surface" },
  { status: "stage", label: "Stage validation", tone: "bg-amber-surface" },
  { status: "blocking", label: "Blocking releases", tone: "bg-pink-surface" },
]

export function RoadmapView({ project, tasks }: { project: string; tasks: Task[] }) {
  const epics = EPICS.filter((e) => project === "all" || e.project === project)
  return (
    <div className="grid grid-cols-1 gap-5 px-4 lg:px-6 @3xl/main:grid-cols-3">
      {LANES.map((lane) => {
        const items = epics.filter((e) => e.status === lane.status)
        return (
          <section key={lane.status} className={cn("rounded-2xl p-4", lane.tone)}>
            <h3 className="mb-3 flex items-center justify-between text-[13px] font-bold text-foreground">
              {lane.label}
              <span className="rounded-full bg-card/70 px-2 py-0.5 text-[11px]">{items.length}</span>
            </h3>
            <div className="space-y-3">
              {items.map((e) => {
                const linked = tasks.filter((t) => t.project === e.project).length
                const owner = PEOPLE.find((p) => p.id === e.owner)!
                return (
                  <article key={e.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-1)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <ProjectChip task={{ project: e.project }} />
                      <span className="text-xs text-muted-foreground">Target {e.target}</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-foreground">{e.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground tabular-nums">{e.progress}%</span>
                      <span className="text-muted-foreground">
                        {linked} linked task{linked === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div role="meter" aria-label={`${e.title} progress`} aria-valuenow={e.progress} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div className={cn("h-full rounded-full", e.status === "blocking" ? "bg-destructive" : "bg-mint")} style={{ width: `${e.progress}%` }} />
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar id={e.owner} />
                      {owner.name}
                    </p>
                  </article>
                )
              })}
              {items.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No epics</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
