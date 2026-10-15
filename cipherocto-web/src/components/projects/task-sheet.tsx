import * as React from "react"

import { Field, inputClass, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PEOPLE, PRIORITY_META, PROJECTS, SPRINT, STATUS_META, STATUS_ORDER, type PersonId, type Priority, type ProjectKey, type Status, type Task } from "@/data/projects"
import { cn } from "@/lib/utils"

const dueFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function TaskSheet({
  open,
  onOpenChange,
  task,
  defaultStatus,
  defaultProject,
  onSave,
  onDelete,
  readOnly = false,
}: {
  readOnly?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  defaultStatus: Status
  defaultProject: ProjectKey | null
  onSave: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = React.useState(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    project: task?.project ?? defaultProject ?? ("habitocto" as ProjectKey),
    priority: task?.priority ?? ("P2" as Priority),
    status: task?.status ?? defaultStatus,
    assignee: task?.assignee ?? ("elena" as PersonId),
    dueDate: "",
  }))
  const [attempted, setAttempted] = React.useState(false)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const titleError = attempted && !form.title.trim() ? "Give the task a title." : undefined

  const save = () => {
    setAttempted(true)
    if (!form.title.trim()) return
    let due = task?.due ?? { label: "No date" }
    let startDay = task?.startDay ?? SPRINT.today
    let endDay = task?.endDay ?? SPRINT.today + 4
    if (form.dueDate) {
      const d = parseDate(form.dueDate)
      due = { label: dueFmt.format(d) }
      endDay = Math.round((d.getTime() - SPRINT.start.getTime()) / 86_400_000)
      startDay = Math.max(0, Math.min(startDay, endDay))
    }
    onSave({
      ...(task ?? { id: `t-${Date.now().toString(36)}` }),
      title: form.title.trim(),
      description: form.description.trim() || "No description yet.",
      project: form.project,
      projectLabel: task && task.project === form.project ? task.projectLabel : undefined,
      priority: form.priority,
      status: form.status,
      assignee: form.assignee,
      due,
      startDay,
      endDay,
      foot: task?.foot,
      extra: task?.extra,
      tag: form.status === "done" ? task?.tag : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{task ? "Edit task" : "New Task / Epic"}</SheetTitle>
          <SheetDescription>{task ? `Last status: ${STATUS_META[task.status].label}` : "Added to the current sprint board."}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="task-title" label="Title" required error={titleError}>
            <TextInput id="task-title" value={form.title} placeholder="Ship the annual-plan paywall" onChange={(e) => set("title", e.target.value)} error={titleError} />
          </Field>
          <Field id="task-desc" label="Description">
            <textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={cn(inputClass, "h-auto py-2")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="task-app" label="App">
              <SelectInput id="task-app" value={form.project} onChange={(e) => set("project", e.target.value as ProjectKey)} options={(Object.keys(PROJECTS) as ProjectKey[]).map((k) => ({ value: k, label: PROJECTS[k].label }))} />
            </Field>
            <Field id="task-priority" label="Priority">
              <SelectInput id="task-priority" value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)} options={(Object.keys(PRIORITY_META) as Priority[]).map((k) => ({ value: k, label: PRIORITY_META[k].label }))} />
            </Field>
            <Field id="task-status" label="Column">
              <SelectInput id="task-status" value={form.status} onChange={(e) => set("status", e.target.value as Status)} options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
            </Field>
            <Field id="task-assignee" label="Assignee">
              <SelectInput id="task-assignee" value={form.assignee} onChange={(e) => set("assignee", e.target.value as PersonId)} options={PEOPLE.map((p) => ({ value: p.id, label: p.name }))} />
            </Field>
          </div>
          <Field id="task-due" label="Due date" hint={task ? `Currently: ${task.due.label}. Leave blank to keep it.` : undefined}>
            <input id="task-due" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={inputClass} />
          </Field>
        </div>
        <SheetFooter className="flex-row justify-between border-t">
          {task ? (
            <Button
              variant="ghost"
              disabled={readOnly}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(task.id)
                onOpenChange(false)
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={readOnly} onClick={save}>{task ? "Save changes" : "Create task"}</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
