import * as React from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowRightIcon,
  ChevronDownIcon,
  DiffIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  HistoryIcon,
  PlusIcon,
  SearchIcon,
  SmartphoneIcon,
} from "lucide-react"

import { AudienceInspector } from "@/components/remote-config/audience-inspector"
import { AuditLogSheet, CompareEnvsSheet } from "@/components/remote-config/env-sheets"
import { ParamEditor } from "@/components/remote-config/param-editor"
import { ParamTable } from "@/components/remote-config/param-table"
import { RemoteConfigKpis } from "@/components/remote-config/rc-kpis"
import { SdkFleet } from "@/components/remote-config/sdk-fleet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApps } from "@/data/apps-context"
import {
  CATEGORY_LABEL,
  diffParams,
  seedStaging,
  SEED_PARAMS,
  type AuditEntry,
  type ClientPlatform,
  type Env,
  type ParamCategory,
  type RemoteParam,
} from "@/data/remote-config"
import { useAuth } from "@/data/auth-context"
import { useCurrentUser } from "@/lib/use-current-user"
import { cn } from "@/lib/utils"

const nowIso = () => new Date().toISOString()
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")

const SEED_AUDIT: AuditEntry[] = [
  { id: "8f3c7a9e21", build: 142, env: "production", by: "Elena Rostova", at: new Date(Date.now() - 14 * 60_000).toISOString(), summary: "Published 1 change: enable_ai_summary", snapshot: SEED_PARAMS },
  { id: "c41d09b7aa", build: 141, env: "production", by: "Marcus Chen", at: new Date(Date.now() - 26 * 3_600_000).toISOString(), summary: "Published 2 changes: paywall_v3_experience, annual_offer_discount_pct", snapshot: SEED_PARAMS },
  { id: "5be2f0c3d8", build: 57, env: "staging", by: "Alex Rivera", at: new Date(Date.now() - 3 * 3_600_000).toISOString(), summary: "Published 3 changes for QA", snapshot: seedStaging(SEED_PARAMS) },
]

const chipBase = "h-9 shrink-0 rounded-full px-3.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap transition-colors"
const utilBtn = "flex h-9 items-center gap-1.5 rounded-lg bg-foreground/[0.04] px-3 text-[11px] font-bold tracking-[0.04em] text-foreground transition-colors hover:bg-foreground/[0.08]"

export default function RemoteConfigPage() {
  const currentUser = useCurrentUser()
  const { can } = useAuth()
  const canPublish = can("config:publish")
  const { apps } = useApps()
  const [searchParams] = useSearchParams()
  const initialApp = searchParams.get("app")

  const [env, setEnv] = React.useState<Env>("production")
  const [scope, setScope] = React.useState<string>(initialApp && apps.some((a) => a.id === initialApp) ? initialApp : "all")
  const [published, setPublished] = React.useState<Record<Env, RemoteParam[]>>(() => ({ production: SEED_PARAMS, staging: seedStaging(SEED_PARAMS) }))
  const [working, setWorking] = React.useState<Record<Env, RemoteParam[]>>(published)
  const [audit, setAudit] = React.useState<AuditEntry[]>(SEED_AUDIT)
  const [category, setCategory] = React.useState<ParamCategory | "all">("all")
  const [client, setClient] = React.useState<ClientPlatform | "all">("all")
  const [query, setQuery] = React.useState("")
  const [showInspector, setShowInspector] = React.useState(true)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [editor, setEditor] = React.useState<{ open: boolean; param: RemoteParam | null; key: number }>({ open: false, param: null, key: 0 })
  const [compareOpen, setCompareOpen] = React.useState(false)
  const [auditOpen, setAuditOpen] = React.useState(false)

  const scopeApp = apps.find((a) => a.id === scope)
  const inScope = React.useCallback((p: RemoteParam) => scope === "all" || p.apps.length === 0 || p.apps.includes(scope), [scope])

  const envParams = working[env]
  const scoped = envParams.filter(inScope)
  const q = query.trim().toLowerCase()
  const filtered = scoped.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (client === "all" || p.platforms.includes(client)) &&
      (!q || [p.key, p.description, p.tag ?? "", ...p.chips].some((s) => s.toLowerCase().includes(q)))
  )

  const drafts = React.useMemo(() => diffParams(published[env], working[env]), [published, working, env])
  const draftIds = new Set(drafts.flatMap((d) => (d.after ? [d.after.id] : [])))
  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null

  const totalMau = apps.reduce((s, a) => s + (a.mau ?? 0), 0)
  const mauFor = (p: RemoteParam | null) => {
    if (!p) return 0
    return apps
      .filter((a) => (p.apps.length === 0 || p.apps.includes(a.id)) && (scope === "all" || a.id === scope))
      .reduce((s, a) => s + (a.mau ?? 0), 0)
  }

  const updateWorking = (fn: (list: RemoteParam[]) => RemoteParam[]) => setWorking((w) => ({ ...w, [env]: fn(w[env]) }))
  const touch = <T extends RemoteParam>(p: T): T => ({ ...p, updatedBy: currentUser.name, updatedAt: new Date().toISOString() })

  const publish = () => {
    if (!drafts.length) return
    const build = Math.max(...audit.filter((a) => a.env === env).map((a) => a.build), 0) + 1
    const keys = drafts.map((d) => d.key)
    setAudit((a) => [
      {
        id: randomId(),
        build,
        env,
        by: currentUser.name,
        at: new Date().toISOString(),
        summary: `Published ${drafts.length} change${drafts.length === 1 ? "" : "s"}: ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "…" : ""}`,
        snapshot: working[env],
      },
      ...a,
    ])
    setPublished((p) => ({ ...p, [env]: working[env] }))
  }

  const revert = (entry: AuditEntry) => {
    const build = Math.max(...audit.filter((a) => a.env === entry.env).map((a) => a.build), 0) + 1
    setWorking((w) => ({ ...w, [entry.env]: entry.snapshot }))
    setPublished((p) => ({ ...p, [entry.env]: entry.snapshot }))
    setAudit((a) => [
      { id: randomId(), build, env: entry.env, by: currentUser.name, at: new Date().toISOString(), summary: `Reverted to v${entry.build}`, snapshot: entry.snapshot },
      ...a,
    ])
  }

  const exportJson = () => {
    const payload = {
      environment: env,
      app: scopeApp?.id ?? "all",
      exportedAt: nowIso(),
      parameters: Object.fromEntries(
        scoped.map((p) => [p.key, { enabled: p.enabled, value: JSON.parse(p.value), default: p.defaultValue, distribution: p.distribution }])
      ),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `remote-config-${env}-${scopeApp?.id ?? "all"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categoryCounts = (c: ParamCategory) => scoped.filter((p) => p.category === c).length
  const envLabel = env === "production" ? "Prod" : "Staging"

  return (
    <>
      {/* Header & actions */}
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Remote Configuration &amp; Feature Flags</h1>
            <span className="rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold tracking-wider text-mint uppercase">Live Sync</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Control experience parameters, orchestrate phased rollouts and flip safety switches in real time — no App Store or Play Store
            submission needed.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex h-10 items-center gap-2 rounded-xl bg-card px-3.5 text-[13px] font-bold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]">
                <span className={cn("size-2.5 rounded-full motion-safe:animate-pulse", env === "production" ? "bg-stream-mrr" : "bg-amber")} />
                {envLabel}: {scopeApp?.name ?? "All Apps"}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              <DropdownMenuLabel>Environment</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={env} onValueChange={(v) => setEnv(v as Env)}>
                <DropdownMenuRadioItem value="production">Production</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="staging">Staging</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>App scope</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={scope} onValueChange={setScope}>
                <DropdownMenuRadioItem value="all">All apps</DropdownMenuRadioItem>
                {apps.map((a) => (
                  <DropdownMenuRadioItem key={a.id} value={a.id}>
                    {a.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => setCompareOpen(true)} className="flex h-10 items-center gap-1.5 rounded-xl bg-foreground/[0.04] px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.08]">
            <DiffIcon className="size-4" />
            Compare Envs
          </button>
          <button type="button" onClick={() => setAuditOpen(true)} className="flex h-10 items-center gap-1.5 rounded-xl bg-foreground/[0.04] px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.08]">
            <HistoryIcon className="size-4" />
            Audit Log
          </button>
          <button
            type="button"
            disabled={!drafts.length || !canPublish}
            title={canPublish ? undefined : "Your role can't publish configuration."}
            onClick={publish}
            className="flex h-10 items-center gap-2 rounded-xl bg-mint-border px-4 text-[13px] font-semibold text-mint shadow-[var(--shadow-1)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={cn("size-2 rounded-full bg-stream-mrr", drafts.length > 0 && "motion-safe:animate-pulse")} />
            Publish ({drafts.length} Draft{drafts.length === 1 ? "" : "s"})
            <ArrowRightIcon className="size-4" />
          </button>
          <button
            type="button"
            disabled={!canPublish} onClick={() => setEditor((e) => ({ open: true, param: null, key: e.key + 1 }))}
            className="disabled:cursor-not-allowed disabled:opacity-40 flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90"
          >
            <PlusIcon className="size-4" />
            New Parameter
          </button>
        </div>
      </section>

      <RemoteConfigKpis params={scoped} draftCount={drafts.length} totalMau={scope === "all" ? totalMau : (scopeApp?.mau ?? 0)} />

      {/* Filter strip */}
      <div className="px-4 lg:px-6">
        <section className="flex flex-col gap-4 rounded-[18px] bg-card p-4 shadow-[var(--shadow-1)] @7xl/main:flex-row @7xl/main:items-center">
          <label className="relative flex h-10 min-w-0 flex-1 items-center">
            <SearchIcon className="absolute left-3.5 size-[18px] text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search key, tags or description (e.g. paywall, ai, rollout)…"
              aria-label="Search parameters"
              className="h-10 w-full rounded-xl bg-background pr-4 pl-10 text-[13px] outline-none placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-ring/10"
            />
          </label>
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap items-center gap-1.5">
            <button type="button" role="radio" aria-checked={category === "all"} onClick={() => setCategory("all")} className={cn(chipBase, category === "all" ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]" : "bg-background text-muted-foreground hover:text-foreground")}>
              All ({scoped.length})
            </button>
            {(Object.keys(CATEGORY_LABEL) as ParamCategory[]).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className={cn(chipBase, category === c ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]" : "bg-background text-muted-foreground hover:text-foreground")}>
                {CATEGORY_LABEL[c]} ({categoryCounts(c)})
              </button>
            ))}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={utilBtn}>
                  <SmartphoneIcon className="size-3.5" />
                  Client: {client === "all" ? "All (iOS/Android)" : client === "ios" ? "iOS" : "Android"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={client} onValueChange={(v) => setClient(v as ClientPlatform | "all")}>
                  <DropdownMenuRadioItem value="all">All clients</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ios">iOS</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="android">Android</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" onClick={exportJson} className={utilBtn}>
              <DownloadIcon className="size-3.5" />
              Export JSON
            </button>
            <button type="button" aria-pressed={showInspector} onClick={() => setShowInspector((v) => !v)} className={cn(utilBtn, "bg-neutral-strong")}>
              {showInspector ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
              Audience Rules
            </button>
          </div>
        </section>
      </div>

      {/* Table + inspector */}
      <div className="grid grid-cols-1 items-start gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className={cn("min-w-0", showInspector ? "@5xl/main:col-span-8" : "@5xl/main:col-span-12")}>
          <ParamTable
            key={`${env}-${scope}-${category}-${client}-${q}`}
            params={filtered}
            draftIds={draftIds}
            selectedId={selected?.id ?? null}
            totalCount={scoped.length}
            onSelect={(p) => setSelectedId(p.id)}
            onToggle={(p, enabled) =>
              updateWorking((list) =>
                list.map((x) =>
                  x.id === p.id ? touch({ ...x, enabled, value: x.category === "killswitch" || x.distribution.kind === "scheduled" ? String(enabled) : x.value }) : x
                )
              )
            }
            onEdit={(p) => setEditor((e) => ({ open: true, param: p, key: e.key + 1 }))}
            onDuplicate={(p) => {
              const keys = new Set(envParams.map((x) => x.key))
              let key = `${p.key}_copy`
              for (let n = 2; keys.has(key); n++) key = `${p.key}_copy_${n}`
              const copy = touch({ ...p, id: randomId(), key, enabled: false })
              updateWorking((list) => [copy, ...list])
              setSelectedId(copy.id)
            }}
            onDelete={(p) => updateWorking((list) => list.filter((x) => x.id !== p.id))}
          />
        </div>
        {showInspector && (
          <div className="min-w-0 @5xl/main:sticky @5xl/main:top-20 @5xl/main:col-span-4">
            <AudienceInspector param={selected} scopedMau={mauFor(selected)} totalMau={totalMau} />
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <SdkFleet
          latest={audit.find((a) => a.env === env)}
          previous={audit.filter((a) => a.env === env)[1]}
          onRevert={revert}
        />
      </div>

      <ParamEditor
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        param={editor.param}
        existingKeys={envParams.map((p) => p.key)}
        apps={apps}
        onSave={(next) => {
          if (next.id) {
            updateWorking((list) => list.map((p) => (p.id === next.id ? touch({ ...p, ...next, id: p.id }) : p)))
          } else {
            const created: RemoteParam = touch({
              ...next,
              id: randomId(),
              enabled: true,
              rules: [],
              chips: next.platforms.length === 2 ? ["iOS & Android"] : [next.platforms[0] === "ios" ? "iOS only" : "Android only"],
              updatedBy: currentUser.name,
              updatedAt: new Date().toISOString(),
            })
            updateWorking((list) => [created, ...list])
            setSelectedId(created.id)
          }
        }}
      />
      <CompareEnvsSheet open={compareOpen} onOpenChange={setCompareOpen} production={working.production} staging={working.staging} />
      <AuditLogSheet open={auditOpen} onOpenChange={setAuditOpen} entries={audit} onRevert={revert} />
    </>
  )
}
