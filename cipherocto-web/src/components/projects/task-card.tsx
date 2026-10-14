import {
  ArrowRightIcon,
  CalendarIcon,
  CheckSquareIcon,
  CircleCheckIcon,
  MessageSquareIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { PEOPLE, PRIORITY_META, PROJECTS, STATUS_META, STATUS_ORDER, type PersonId, type Task } from "@/data/projects"
import { cn } from "@/lib/utils"

export function Avatar({ id, size = "size-6" }: { id: PersonId; size?: string }) {
  const p = PEOPLE.find((x) => x.id === id)!
  return (
    <span title={p.name} className={cn("flex shrink-0 items-center justify-center rounded-full text-[9px] font-bold", size, p.tone)}>
      {p.initials}
    </span>
  )
}

export function ProjectChip({ task }: { task: Pick<Task, "project" | "projectLabel"> }) {
  const p = PROJECTS[task.project]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", p.chip)}>
      <span className={cn("size-1.5 rounded-full", p.dot)} />
      {task.projectLabel ?? p.label}
    </span>
  )
}

function Footer({ task }: { task: Task }) {
  const f = task.foot
  return (
    <div className="flex items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
      <span className="flex min-w-0 items-center gap-2">
        <Avatar id={task.assignee} />
        {f?.kind === "check" && (
          <span className="flex items-center gap-1">
            <CheckSquareIcon className="size-3.5" />
            {f.value}
          </span>
        )}
        {f?.kind === "chat" && (
          <span className="flex items-center gap-1">
            <MessageSquareIcon className="size-3.5" />
            {f.value}
          </span>
        )}
        {f?.kind === "text" && <span className="truncate">{f.value}</span>}
      </span>
      {task.status === "done" ? (
        <CircleCheckIcon className="size-4 shrink-0 text-mint" />
      ) : (
        <span className={cn("flex shrink-0 items-center gap-1 whitespace-nowrap", task.due.urgent && "font-semibold text-destructive")}>
          <CalendarIcon className="size-3.5" />
          {task.due.label}
        </span>
      )}
    </div>
  )
}

export function TaskCard({
  task,
  compact,
  onOpen,
  onAdvance,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  task: Task
  compact: boolean
  onOpen: (t: Task) => void
  onAdvance: (t: Task) => void
  onDragStart: (t: Task) => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const pr = PRIORITY_META[task.priority]
  const next = STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1]
  const x = task.extra

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", task.id)
        onDragStart(task)
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl bg-card p-4 shadow-[var(--shadow-1)] transition-all hover:shadow-[var(--shadow-2)]",
        task.status === "done" && "opacity-90 hover:opacity-100",
        dragging && "opacity-40"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <ProjectChip task={task} />
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", task.tag ? "bg-mint-border text-mint" : pr.className)}>
          {task.tag ?? pr.label}
        </span>
      </div>

      <button type="button" onClick={() => onOpen(task)} className="block w-full text-left">
        <h4
          className={cn(
            "text-[13px] leading-[18px] font-bold text-foreground group-hover:text-primary",
            task.status === "done" && "line-through",
            task.priority === "P0" && task.status !== "done" && "flex items-start gap-1 text-destructive"
          )}
        >
          {task.priority === "P0" && task.status !== "done" && <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />}
          {task.title}
        </h4>
        {!compact && <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-muted-foreground">{task.description}</p>}
      </button>

      {!compact && x?.kind === "warn" && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded bg-amber-surface px-2 py-1 text-[11px] font-semibold text-amber">
          <PaperclipIcon className="size-3" />
          {x.text}
        </div>
      )}
      {!compact && x?.kind === "flag" && (
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="rounded bg-foreground/[0.05] px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{x.flag}</span>
            <span className="text-xs font-bold text-mint">{x.progress}% Complete</span>
          </div>
          <div role="meter" aria-label="Flag rollout" aria-valuenow={x.progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className="h-full rounded-full bg-mint" style={{ width: `${x.progress}%` }} />
          </div>
        </div>
      )}
      {!compact && x?.kind === "chips" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {x.chips.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded bg-foreground/[0.05] px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              <ShieldCheckIcon className="size-3" />
              {c}
            </span>
          ))}
        </div>
      )}
      {!compact && x?.kind === "build" && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-neutral-strong p-2 text-[11px]">
          <span className="font-semibold text-foreground">{x.text}</span>
          {x.verified && (
            <span className="flex items-center gap-0.5 font-bold text-mint">
              <ShieldCheckIcon className="size-3" />
              Verified
            </span>
          )}
        </div>
      )}
      {!compact && x?.kind === "audit" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className="rounded bg-mint-surface px-2 py-0.5 text-[10px] font-bold text-mint">{x.label}</span>
          <span className="text-muted-foreground">{x.note}</span>
        </div>
      )}
      {!compact && x?.kind === "live" && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-foreground/[0.04] p-2">
          <span className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap text-mint">
            <span className="size-2 rounded-full bg-stream-mrr" />
            {x.text}
          </span>
          <span className="text-xs text-muted-foreground">{x.note}</span>
        </div>
      )}

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Footer task={task} />
        </div>
      </div>

      {next && (
        <button
          type="button"
          onClick={() => onAdvance(task)}
          className="mt-2 hidden w-full items-center justify-center gap-1 rounded-lg bg-foreground/[0.04] py-1 text-[11px] font-bold text-muted-foreground group-focus-within:flex group-hover:flex hover:bg-foreground/[0.08] hover:text-foreground"
        >
          Move to {STATUS_META[next].label}
          <ArrowRightIcon className="size-3" />
        </button>
      )}
    </article>
  )
}
