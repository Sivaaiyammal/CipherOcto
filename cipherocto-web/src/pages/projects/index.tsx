import * as React from "react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  GanttChartIcon,
  KanbanIcon,
  ListIcon,
  PlusCircleIcon,
  RowsIcon,
  RouteIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  ClipboardListIcon,
  CheckCheckIcon,
} from "lucide-react"

import { Board, type Grouping } from "@/components/projects/board"
import { GanttView, ListView, RoadmapView } from "@/components/projects/alt-views"
import { ProjectKpis } from "@/components/projects/project-kpis"
import { SprintSheet, type SprintSheetMode } from "@/components/projects/sprint-sheet"
import { TaskSheet } from "@/components/projects/task-sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PEOPLE, PROJECTS, SEED_TASKS, SPRINT, STATUS_META, type ProjectKey, type Status, type Task } from "@/data/projects"
import { useAuth } from "@/data/auth-context"
import { downloadFile, toCsv } from "@/lib/download"
import { cn } from "@/lib/utils"

type View = "kanban" | "gantt" | "list" | "roadmap"

const VIEWS: { value: View; label: string; icon: typeof KanbanIcon }[] = [
  { value: "kanban", label: "Kanban Board", icon: KanbanIcon },
  { value: "gantt", label: "Gantt", icon: GanttChartIcon },
  { value: "list", label: "List", icon: ListIcon },
  { value: "roadmap", label: "Roadmaps", icon: RouteIcon },
]

const GROUP_LABEL: Record<Grouping, string> = { none: "None", app: "By App", priority: "By Priority" }

const triggerBtn =
  "flex h-10 items-center gap-1.5 rounded-xl bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"

export default function ProjectsPage() {
  const { can } = useAuth()
  const canWrite = can("projects:write")
  const [tasks, setTasks] = React.useState<Task[]>(SEED_TASKS)
  const [view, setView] = React.useState<View>("kanban")
  const [project, setProject] = React.useState<ProjectKey | "all">("all")
  const [query, setQuery] = React.useState("")
  const [grouping, setGrouping] = React.useState<Grouping>("none")
  const [compact, setCompact] = React.useState(false)
  const [signedOff, setSignedOff] = React.useState<Set<string>>(new Set())
  const [sprintClosed, setSprintClosed] = React.useState(false)
  const [editor, setEditor] = React.useState<{ open: boolean; task: Task | null; status: Status; key: number }>({
    open: false,
    task: null,
    status: "backlog",
    key: 0,
  })
  const [sprintSheet, setSprintSheet] = React.useState<{ open: boolean; mode: SprintSheetMode }>({ open: false, mode: "report" })

  const q = query.trim().toLowerCase()
  const visible = tasks.filter(
    (t) => (project === "all" || t.project === project) && (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  )
  const closed = SPRINT.baseClosed + tasks.filter((t) => t.status === "done").length

  const openEditor = (task: Task | null, status: Status = "backlog") => setEditor((e) => ({ open: true, task, status, key: e.key + 1 }))
  const move = (id: string, status: Status) =>
    setTasks((list) =>
      list.map((t) =>
        t.id === id && t.status !== status
          ? { ...t, status, tag: status === "done" ? (t.tag ?? "Shipped") : undefined, foot: status === "done" ? { kind: "text", value: "Completed today" } : t.foot }
          : t
      )
    )
  const save = (t: Task) =>
    setTasks((list) => (list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [t, ...list]))

  const toggleSignOff = (item: string) =>
    setSignedOff((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })

  const exportBoard = () =>
    downloadFile(
      "sprint-board.csv",
      toCsv([
        ["Task", "App", "Priority", "Column", "Assignee", "Due"],
        ...visible.map((t) => [
          t.title,
          t.projectLabel ?? PROJECTS[t.project].label,
          t.priority,
          STATUS_META[t.status].label,
          PEOPLE.find((p) => p.id === t.assignee)?.name ?? "",
          t.due.label,
        ]),
      ])
    )

  const count = (k: ProjectKey) => tasks.filter((t) => t.project === k).length
  const scopeLabel = project === "all" ? "All Apps (8 active)" : PROJECTS[project].label

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-2xl space-y-1">
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <span>Sprint Pipeline</span>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-semibold text-foreground">
              {SPRINT.name} ({SPRINT.range})
            </span>
            <span
              className={cn(
                "ml-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]",
                sprintClosed ? "bg-neutral-strong text-muted-foreground" : "bg-mint-border text-mint"
              )}
            >
              <span className={cn("size-1.5 rounded-full", sprintClosed ? "bg-muted-foreground" : "bg-stream-mrr motion-safe:animate-pulse")} />
              {sprintClosed ? "COMPLETED" : "ACTIVE CYCLE"}
            </span>
          </p>
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Projects &amp; Tasks</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sprint delivery, cross-app product epics, App Store release milestones, and compliance task pipelines.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={triggerBtn}>
                <span className="size-2.5 rounded-full bg-stream-mrr" />
                {scopeLabel}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>App</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={project} onValueChange={(v) => setProject(v as ProjectKey | "all")}>
                <DropdownMenuRadioItem value="all">All apps</DropdownMenuRadioItem>
                {(Object.keys(PROJECTS) as ProjectKey[]).map((k) => (
                  <DropdownMenuRadioItem key={k} value={k}>
                    {PROJECTS[k].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div role="radiogroup" aria-label="View" className="flex h-10 items-center rounded-xl bg-foreground/[0.06] p-1">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={view === v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap",
                  view === v.value ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <v.icon className="size-4" />
                {v.label}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={triggerBtn}>
                <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
                Grouping: {GROUP_LABEL[grouping]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Group cards</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
                {(Object.keys(GROUP_LABEL) as Grouping[]).map((g) => (
                  <DropdownMenuRadioItem key={g} value={g}>
                    {GROUP_LABEL[g]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            disabled={!canWrite} onClick={() => openEditor(null)}
            className="disabled:cursor-not-allowed disabled:opacity-40 flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90"
          >
            <PlusCircleIcon className="size-4" />
            New Task / Epic
          </button>
        </div>
      </section>

      <ProjectKpis closed={closed} signedOff={signedOff} onToggleSignOff={toggleSignOff} />

      <div className="px-4 lg:px-6">
        <section className="flex flex-col justify-between gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-1)] @5xl/main:flex-row @5xl/main:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-[13px] font-bold text-foreground">
              <span className="size-2.5 rounded-full bg-stream-mrr" />
              Focus App Filter:
            </span>
            <div role="radiogroup" aria-label="App filter" className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={project === "all"}
                onClick={() => setProject("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.04em]",
                  project === "all" ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]" : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.09]"
                )}
              >
                All Entities ({tasks.length})
              </button>
              {(Object.keys(PROJECTS) as ProjectKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={project === k}
                  onClick={() => setProject(k)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.04em]",
                    project === k ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]" : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.09]"
                  )}
                >
                  <span className={cn("size-2 rounded-full", PROJECTS[k].dot)} />
                  {PROJECTS[k].label} ({count(k)})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative flex h-9 w-full items-center sm:w-64">
              <SearchIcon className="absolute left-2.5 size-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter current board…"
                aria-label="Filter board"
                className="h-9 w-full rounded-lg bg-background pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-foreground/[0.05]"
              />
            </label>
            <button
              type="button"
              aria-pressed={compact}
              title="Toggle compact view"
              onClick={() => setCompact((v) => !v)}
              className={cn("rounded-lg p-2", compact ? "bg-foreground/[0.1] text-foreground" : "bg-background text-muted-foreground hover:text-foreground")}
            >
              <RowsIcon className="size-[18px]" />
            </button>
            <button type="button" title="Export board report" onClick={exportBoard} className="rounded-lg bg-background p-2 text-muted-foreground hover:text-foreground">
              <DownloadIcon className="size-[18px]" />
            </button>
          </div>
        </section>
      </div>

      {view === "kanban" && (
        <Board readOnly={!canWrite} tasks={visible} grouping={grouping} compact={compact} onOpen={(t) => openEditor(t)} onAdd={(s) => openEditor(null, s)} onMove={move} />
      )}
      {view === "list" && <ListView readOnly={!canWrite} tasks={visible} onOpen={(t) => openEditor(t)} onStatus={move} />}
      {view === "gantt" && <GanttView tasks={visible} onOpen={(t) => openEditor(t)} />}
      {view === "roadmap" && <RoadmapView project={project} tasks={tasks} />}

      <div className="px-4 lg:px-6">
        <section className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)] @5xl/main:flex-row @5xl/main:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mint-border text-mint">
              <CheckCheckIcon className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{SPRINT.name} Burndown Health</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {closed} of {SPRINT.total} tasks closed. 64 story points committed, 54 points burned. Ideal trajectory on track (+3.2 days ahead).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-right leading-tight">
                <p className="text-[11px] font-bold tracking-[0.04em] text-foreground">Velocity Trend</p>
                <p className="text-xs font-semibold text-mint">14.2 pts/day</p>
              </div>
              <svg viewBox="0 0 100 24" fill="none" className="h-8 w-28 overflow-visible text-mint" aria-hidden="true">
                <path d="M 0,20 L 15,18 L 30,19 L 45,12 L 60,14 L 75,6 L 90,4 L 100,2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                <circle cx="100" cy="2" r="3" fill="currentColor" />
              </svg>
            </div>
            <span className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSprintSheet({ open: true, mode: "report" })}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-foreground/[0.05] px-3.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.09]"
              >
                <ClipboardListIcon className="size-4" />
                Sprint Report
              </button>
              <button
                type="button"
                disabled={sprintClosed}
                onClick={() => setSprintSheet({ open: true, mode: "complete" })}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90 disabled:opacity-60"
              >
                <CheckCheckIcon className="size-4" />
                {sprintClosed ? "Sprint Completed" : "Complete Sprint"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <TaskSheet
        readOnly={!canWrite}
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        task={editor.task}
        defaultStatus={editor.status}
        defaultProject={project === "all" ? null : project}
        onSave={save}
        onDelete={(id) => setTasks((list) => list.filter((t) => t.id !== id))}
      />
      <SprintSheet
        open={sprintSheet.open}
        onOpenChange={(open) => setSprintSheet((s) => ({ ...s, open }))}
        mode={sprintSheet.mode}
        tasks={tasks}
        closed={closed}
        onComplete={() => {
          setTasks((list) => list.map((t) => (t.status === "done" ? t : { ...t, status: "backlog" as const })))
          setSprintClosed(true)
        }}
      />
    </>
  )
}
