import * as React from "react"
import {
  AlarmClockIcon,
  CopyIcon,
  CopyPlusIcon,
  EllipsisVerticalIcon,
  FlaskConicalIcon,
  HistoryIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { relativeTime, TYPE_LABEL, type RemoteParam } from "@/data/remote-config"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 6

const TYPE_PILL: Record<RemoteParam["type"], string> = {
  boolean: "bg-mint-surface text-mint",
  string: "bg-blue-surface text-tertiary",
  number: "bg-amber-surface text-amber",
  json: "bg-lavender-surface text-lavender",
}

const SPLIT_COLORS = ["bg-lavender", "bg-lavender/60", "bg-lavender/30", "bg-lavender/20"]

function TypePill({ p }: { p: RemoteParam }) {
  if (p.category === "killswitch") return <span className="rounded-full bg-pink-surface px-2 py-0.5 text-[10px] font-bold text-pink">Kill Switch</span>
  if (p.distribution.kind === "scheduled") return <span className="rounded-full bg-amber-surface px-2 py-0.5 text-[10px] font-bold text-amber">Scheduled</span>
  if (p.distribution.kind === "split" && p.distribution.variants.length > 2)
    return <span className="rounded-full bg-amber-surface px-2 py-0.5 text-[10px] font-bold text-amber">Multi-Variant</span>
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TYPE_PILL[p.type])}>{p.type === "json" ? "JSON UI" : TYPE_LABEL[p.type]}</span>
}

function Distribution({ p }: { p: RemoteParam }) {
  const d = p.distribution
  let label: string
  let value: React.ReactNode
  let bar: React.ReactNode
  if (d.kind === "rollout") {
    label = d.pct === 100 ? "Deployment" : "Phased Rollout"
    value = <span className={cn("font-bold", p.enabled ? "text-mint" : "text-muted-foreground")}>{d.pct === 100 ? "100% Global" : `${d.pct}% Segment`}</span>
    bar = <div className={cn("h-full rounded-full transition-[width] duration-500", p.enabled ? "bg-stream-mrr" : "bg-neutral-deep")} style={{ width: `${d.pct}%` }} />
  } else if (d.kind === "split") {
    label = d.variants.length > 2 ? `${d.variants.length}-Way Split` : "Variant Split"
    value = <span className="font-bold text-lavender">{d.variants.map((v) => `${v.pct}%${d.variants.length === 2 ? ` ${v.name}` : ""}`).join(" / ")}</span>
    bar = d.variants.map((v, i) => <div key={v.name} className={cn("h-full", SPLIT_COLORS[i])} style={{ width: `${v.pct}%` }} />)
  } else if (d.kind === "scheduled") {
    label = "Target Scope"
    value = <span className="font-bold text-foreground">Global Storefronts</span>
    bar = <div className="h-full w-full bg-neutral-deep" />
  } else {
    label = "Target"
    value = <span className="font-bold text-foreground">{d.scope}</span>
    bar = <div className="h-full w-full bg-neutral-deep" />
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        {value}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">{bar}</div>
      <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        {p.chips.map((c) => (
          <span key={c} className={cn("rounded px-1.5 py-0.5", c === "Armed & Ready" ? "bg-mint-surface font-semibold text-mint" : "bg-foreground/[0.05]")}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function LiveValue({ p }: { p: RemoteParam }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  const valueClass =
    p.type === "boolean"
      ? p.value === "true" ? "font-bold text-mint" : "font-bold text-muted-foreground"
      : p.type === "string" ? "font-medium text-tertiary" : p.type === "number" ? "font-bold text-amber" : "text-muted-foreground"
  const aside =
    p.distribution.kind === "scheduled"
      ? <span className="shrink-0 text-[10px] text-amber">Arms to: {p.distribution.armsTo}</span>
      : p.category === "killswitch"
        ? <span className="shrink-0 text-[10px] text-muted-foreground">{p.enabled ? "Bypass ACTIVE" : "Bypass Inactive"}</span>
        : p.type !== "json" && <span className="hidden shrink-0 text-[10px] text-muted-foreground @7xl/main:inline">(def: {p.defaultValue})</span>

  return (
    <div className="group/code relative flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 font-mono text-xs">
      <span className={cn("min-w-0 truncate", valueClass)} title={p.value}>
        {p.value}
      </span>
      {aside}
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(p.value).then(() => setCopied(true), () => undefined)}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded bg-card px-1 py-0.5 opacity-0 shadow-[var(--shadow-1)] transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
        aria-label={`Copy value of ${p.key}`}
      >
        <CopyIcon className={cn("size-3", copied && "text-mint")} />
      </button>
    </div>
  )
}

export function ParamTable({
  params,
  draftIds,
  selectedId,
  totalCount,
  onSelect,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  params: RemoteParam[]
  draftIds: Set<string>
  selectedId: string | null
  totalCount: number
  onSelect: (p: RemoteParam) => void
  onToggle: (p: RemoteParam, enabled: boolean) => void
  onEdit: (p: RemoteParam) => void
  onDuplicate: (p: RemoteParam) => void
  onDelete: (p: RemoteParam) => void
}) {
  const [page, setPage] = React.useState(1)
  const pageCount = Math.max(1, Math.ceil(params.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = params.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div className="overflow-hidden rounded-[18px] bg-card shadow-[var(--shadow-1)]">
      <div className="hidden grid-cols-12 items-center gap-4 bg-background px-6 py-3.5 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase @3xl/main:grid">
        <div className="col-span-4">Flag / Parameter Key</div>
        <div className="col-span-3">Targeting &amp; Distribution</div>
        <div className="col-span-3">Live Value / Payload</div>
        <div className="col-span-2 text-right">State / Actions</div>
      </div>

      <ul className="divide-y divide-border/60">
        {visible.map((p) => {
          const isDraft = draftIds.has(p.id)
          const selected = p.id === selectedId
          return (
            <li
              key={p.id}
              onClick={() => onSelect(p)}
              className={cn(
                "cursor-pointer p-6 transition-colors hover:bg-foreground/[0.02]",
                selected && "bg-mint-surface/50 shadow-[inset_3px_0_0_var(--stream-mrr)] hover:bg-mint-surface/60"
              )}
            >
              <div className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-12 min-w-0 space-y-1.5 @3xl/main:col-span-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-bold tracking-tight text-foreground">{p.key}</span>
                    <TypePill p={p} />
                    {p.tag && <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">{p.tag}</span>}
                    {isDraft && <span className="rounded-full bg-amber-hover px-2 py-0.5 text-[10px] font-bold text-amber">Draft</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {p.distribution.kind === "scheduled" ? (
                      <>
                        <AlarmClockIcon className="size-3 text-amber" />
                        <span className="font-semibold text-amber">
                          Starts {new Date(p.distribution.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, 00:00 UTC
                        </span>
                      </>
                    ) : (
                      <>
                        <HistoryIcon className="size-3" />
                        <span>
                          {relativeTime(p.updatedAt)} by <span className="font-semibold text-foreground">{p.updatedBy}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="line-clamp-1 text-[13px] text-muted-foreground">{p.description}</p>
                </div>

                <div className="col-span-12 @3xl/main:col-span-3">
                  <Distribution p={p} />
                </div>

                <div className="col-span-8 min-w-0 @3xl/main:col-span-3">
                  <LiveValue p={p} />
                </div>

                <div className="col-span-4 flex items-center justify-end gap-1 @3xl/main:col-span-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) => onToggle(p, v)}
                    aria-label={`${p.enabled ? "Disable" : "Enable"} ${p.key}`}
                    className="data-[state=checked]:bg-stream-mrr data-[state=unchecked]:bg-neutral-deep"
                  />
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    title={p.category === "killswitch" ? "Edit kill switch" : "Edit parameter"}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    {p.category === "killswitch" ? <ShieldIcon className="size-[18px]" /> : p.category === "experiment" ? <FlaskConicalIcon className="size-[18px]" /> : <PencilIcon className="size-[18px]" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`More actions for ${p.key}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground">
                        <EllipsisVerticalIcon className="size-[18px]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(p.key)}>
                        <CopyIcon />
                        Copy key
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDuplicate(p)}>
                        <CopyPlusIcon />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(p)}>
                        <Trash2Icon />
                        Delete parameter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </li>
          )
        })}
        {visible.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">No parameters match your filters.</li>}
      </ul>

      <footer className="flex items-center justify-between gap-2 bg-card px-6 py-3.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          Showing {visible.length} of {params.length}
          {params.length !== totalCount && ` (filtered from ${totalCount})`} runtime parameters
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            className="rounded bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-foreground/[0.06] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="tabular-nums">
            <strong className="text-foreground">{current}</strong> of {pageCount}
          </span>
          <button
            type="button"
            disabled={current === pageCount}
            onClick={() => setPage(current + 1)}
            className="rounded bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-foreground/[0.06] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}
