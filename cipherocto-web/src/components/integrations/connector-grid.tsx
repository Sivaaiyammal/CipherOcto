import * as React from "react"
import {
  ActivityIcon,
  ArrowRightIcon,
  BellRingIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  CreditCardIcon,
  DatabaseIcon,
  FlameIcon,
  LayersIcon,
  Link2Icon,
  Loader2Icon,
  MessageSquareIcon,
  PauseCircleIcon,
  SearchIcon,
  ShoppingBagIcon,
  SmartphoneIcon,
  SnowflakeIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORY_LABEL, type Category, type IconKey, type Integration } from "@/data/integrations"
import { cn } from "@/lib/utils"

const ICONS: Record<IconKey, LucideIcon> = {
  phone: SmartphoneIcon,
  shop: ShoppingBagIcon,
  card: CreditCardIcon,
  monitor: ActivityIcon,
  flame: FlameIcon,
  chat: MessageSquareIcon,
  bell: BellRingIcon,
  users: UsersIcon,
  snow: SnowflakeIcon,
  database: DatabaseIcon,
  layers: LayersIcon,
  link: Link2Icon,
}

export type TestState = { state: "running" } | { state: "ok"; ms: number } | { state: "fail" }

type TabValue = Category | "all"
type StatusFilter = "all" | "active" | "paused"

const TABS: TabValue[] = ["all", "stores", "telemetry", "webhooks", "warehouse"]
const INITIAL_VISIBLE = 6

export function ConnectorGrid({
  integrations,
  tests,
  onTest,
  onConfigure,
  onTogglePause,
  readOnly = false,
}: {
  readOnly?: boolean
  integrations: Integration[]
  tests: Record<string, TestState>
  onTest: (i: Integration) => void
  onConfigure: (i: Integration) => void
  onTogglePause: (i: Integration) => void
}) {
  const [tab, setTab] = React.useState<TabValue>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [query, setQuery] = React.useState("")
  const [expanded, setExpanded] = React.useState(false)

  const count = (t: TabValue) => (t === "all" ? integrations.length : integrations.filter((i) => i.category === t).length)
  const q = query.trim().toLowerCase()
  const filtered = integrations.filter(
    (i) =>
      (tab === "all" || i.category === tab) &&
      (status === "all" || (status === "paused" ? i.status === "paused" : i.status !== "paused")) &&
      (!q || [i.name, i.subtitle, ...i.meta.map((m) => m.value)].some((s) => s.toLowerCase().includes(q)))
  )
  const shown = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE)

  return (
    <>
      <section className="mx-4 flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-card p-2 shadow-[var(--shadow-1)] lg:mx-6 @7xl/main:flex-row @7xl/main:items-center">
        <div role="radiogroup" aria-label="Category" className="flex gap-1 overflow-x-auto rounded-xl bg-foreground/[0.05] p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tab === t}
              onClick={() => {
                setTab(t)
                setExpanded(false)
              }}
              className={cn(
                "rounded-lg px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap",
                tab === t ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "All Integrations" : CATEGORY_LABEL[t]} ({count(t)})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex h-9 flex-1 items-center @7xl/main:w-72 @7xl/main:flex-none">
            <SearchIcon className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter integrations, keys…"
              aria-label="Filter integrations"
              className="h-9 w-full rounded-lg bg-background pr-3 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-foreground/[0.04]"
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-background px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-foreground/[0.06]">
                <span className={cn("size-2 rounded-full", status === "paused" ? "bg-amber" : "bg-stream-mrr")} />
                Status: {status === "all" ? "Any" : status === "active" ? "Connected" : "Paused"}
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <DropdownMenuRadioItem value="all">Any</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Connected</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="paused">Paused</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section className="space-y-4 px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Core Infrastructure Connectors</h2>
            <p className="text-[13px] text-muted-foreground">
              Direct bi-directional real-time bridges for in-app purchases, entitlement ledgers, and telemetry.
            </p>
          </div>
          <a href="#webhooks" className="flex items-center gap-1 text-[13px] font-semibold text-tertiary hover:underline">
            Manage Ingress Ports
            <ArrowRightIcon className="size-4" />
          </a>
        </header>

        <div className="grid grid-cols-1 gap-5 @3xl/main:grid-cols-2">
          {shown.map((i) => {
            const Icon = ICONS[i.icon]
            const paused = i.status === "paused"
            const t = tests[i.id]
            return (
              <article key={i.id} className={cn("flex flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)] transition-all hover:shadow-[var(--shadow-2)]", paused && "opacity-80")}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neutral-strong text-foreground">
                        <Icon className="size-6" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg leading-[26px] font-semibold text-foreground">{i.name}</h3>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap",
                              paused ? "bg-amber-hover text-amber" : i.status === "streaming" ? "bg-lavender-hover text-lavender" : "bg-mint-border text-mint"
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", paused ? "bg-amber" : i.status === "streaming" ? "bg-lavender" : "bg-stream-mrr")} />
                            {i.chip}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground">{i.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <dl className="space-y-2 rounded-xl bg-background p-4">
                    {i.meta.map((m) => (
                      <div key={m.label} className="flex items-center justify-between gap-3 text-[13px]">
                        <dt className="shrink-0 text-muted-foreground">{m.label}</dt>
                        <dd
                          className={cn(
                            "min-w-0 truncate text-right",
                            m.mono ? "rounded bg-card px-2 py-0.5 font-mono text-xs font-semibold text-foreground shadow-[var(--shadow-1)]" : "font-semibold text-foreground",
                            m.tone === "error" && "text-destructive"
                          )}
                          title={m.value}
                        >
                          {m.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="flex flex-col justify-between gap-3 @xl/main:flex-row @xl/main:items-center">
                  <p
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold",
                      t?.state === "fail" ? "text-destructive" : paused ? "text-amber" : "text-mint"
                    )}
                    aria-live="polite"
                  >
                    {t?.state === "running" ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />
                        Sending test ping…
                      </>
                    ) : t?.state === "ok" ? (
                      <>
                        <CheckCircle2Icon className="size-3.5" />
                        Test passed · {t.ms}ms round-trip
                      </>
                    ) : t?.state === "fail" ? (
                      <>
                        <CircleAlertIcon className="size-3.5" />
                        Test failed — connector is paused
                      </>
                    ) : paused ? (
                      <>
                        <PauseCircleIcon className="size-3.5" />
                        {i.healthLine}
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon className="size-3.5" />
                        {i.healthLine}
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {paused && (
                      <button type="button" disabled={readOnly} onClick={() => onTogglePause(i)} className="disabled:cursor-not-allowed disabled:opacity-40 rounded-lg bg-mint-border px-3 py-1.5 text-[13px] font-semibold text-mint hover:opacity-90">
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={t?.state === "running"}
                      onClick={() => onTest(i)}
                      className="rounded-lg bg-foreground/[0.05] px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.09] disabled:opacity-60"
                    >
                      {i.testLabel}
                    </button>
                    <button type="button" disabled={readOnly} onClick={() => onConfigure(i)} className="disabled:cursor-not-allowed disabled:opacity-40 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
                      {i.configLabel}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {filtered.length === 0 && <p className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-1)]">No integrations match your filters.</p>}
        {filtered.length > INITIAL_VISIBLE && (
          <div className="flex justify-center">
            <button type="button" onClick={() => setExpanded((v) => !v)} className="rounded-xl bg-card px-4 py-2 text-[13px] font-semibold shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]">
              {expanded ? "Show fewer" : `Show ${filtered.length - INITIAL_VISIBLE} more integrations`}
            </button>
          </div>
        )}
      </section>
    </>
  )
}
