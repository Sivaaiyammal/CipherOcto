import * as React from "react"
import { ChevronDownIcon, DownloadIcon, FilterXIcon, SearchIcon, UserPlusIcon } from "lucide-react"

import { InviteSheet, MemberSheet } from "@/components/team/access-sheets"
import { AuditStream, RbacTiers } from "@/components/team/lower-panels"
import { Roster } from "@/components/team/roster"
import { AuditPanel, InvitesPanel, PermissionMatrix, ServicesPanel } from "@/components/team/tab-panels"
import { TeamKpis } from "@/components/team/team-kpis"
import { useAuth } from "@/data/auth-context"
import { APP_SCOPES, ROLES, roleOf, SEED_AUDIT, SEED_INVITES, SEED_MEMBERS, SEED_SERVICES, ageLabel, type AppScopeId, type AuditEvent, type AuditKind, type Invite, type Member, type RoleId, type ServiceAccount } from "@/data/team"
import { useCurrentUser } from "@/lib/use-current-user"
import { downloadFile, toCsv } from "@/lib/download"
import { cn } from "@/lib/utils"

type Tab = "members" | "invites" | "roles" | "services" | "audit"

const selectClass =
  "h-10 appearance-none rounded-lg bg-card pr-8 pl-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] outline-none focus:ring-2 focus:ring-ring/20"

export default function TeamPage() {
  const currentUser = useCurrentUser()
  const { can } = useAuth()
  const canManage = can("team:manage")
  const [members, setMembers] = React.useState<Member[]>(SEED_MEMBERS)
  const [invites, setInvites] = React.useState<Invite[]>(SEED_INVITES)
  const [services, setServices] = React.useState<ServiceAccount[]>(SEED_SERVICES)
  const [audit, setAudit] = React.useState<AuditEvent[]>(SEED_AUDIT)
  const [tab, setTab] = React.useState<Tab>("members")
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<RoleId | "all">("all")
  const [scopeFilter, setScopeFilter] = React.useState<AppScopeId | "all">("all")
  const [auditFilter, setAuditFilter] = React.useState<AuditKind | "all">("all")
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Member | null>(null)
  const [editKey, setEditKey] = React.useState(0)
  const [totalAudit, setTotalAudit] = React.useState(3_412)

  const log = (e: Omit<AuditEvent, "id" | "ageMin" | "actor"> & { actor?: string }) => {
    setAudit((list) => [{ id: `a-${Date.now().toString(36)}-${list.length}`, actor: currentUser.name, ageMin: 0, ...e }, ...list])
    setTotalAudit((n) => n + 1)
  }

  const q = query.trim().toLowerCase()
  const filtered = members.filter(
    (m) =>
      (roleFilter === "all" || m.roleId === roleFilter) &&
      (scopeFilter === "all" || m.scope === "all" || m.scope.includes(scopeFilter)) &&
      (!q || [m.name, m.email, m.title, roleOf(m.roleId).label].some((s) => s.toLowerCase().includes(q)))
  )
  const filtersOn = roleFilter !== "all" || scopeFilter !== "all" || q !== ""

  const tabs: { id: Tab; label: string; count?: number | string; pill?: boolean }[] = [
    { id: "members", label: "All Members", count: members.length },
    { id: "invites", label: "Pending Invites", count: invites.length, pill: true },
    { id: "roles", label: "Roles & Permissions", count: ROLES.length },
    { id: "services", label: "Service Accounts & Keys", count: services.length },
    { id: "audit", label: "Audit Logs" },
  ]

  const exportAudit = (events: AuditEvent[], name: string) =>
    downloadFile(
      name,
      toCsv([
        ["When", "Actor", "Action", "Target", "Context", "Type"],
        ...events.map((e) => [ageLabel(e.ageMin), e.actor, e.action, e.target ?? "", e.meta, e.kind]),
      ])
    )

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @5xl/main:flex-row @5xl/main:items-center @5xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Team Management &amp; Access Control</h1>
            <span className="rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold tracking-wider text-mint uppercase">RBAC Tier 1</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Manage members, granular RBAC permissions, App Store Connect &amp; Google Play developer access, and security audit logs across
            your app portfolio.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportAudit(audit, "audit-log.csv")}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
          >
            <DownloadIcon className="size-[18px] text-muted-foreground" />
            Export Audit Log (CSV)
          </button>
          <button
            type="button"
            disabled={!canManage} onClick={() => setInviteOpen(true)}
            className="disabled:cursor-not-allowed disabled:opacity-40 flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90"
          >
            <UserPlusIcon className="size-[18px]" />
            Invite Team Member
          </button>
        </div>
      </section>

      <TeamKpis members={members} invites={invites} />

      <div className="flex flex-col justify-between gap-3 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-center">
        <div role="tablist" aria-label="Team sections" className="flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-foreground/[0.06] p-1 shadow-[var(--shadow-1)] @7xl/main:w-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-all",
                tab === t.id ? "bg-card font-bold text-foreground shadow-[var(--shadow-1)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count != null && (
                <span className={cn("ml-1.5 text-xs font-normal", t.pill ? "rounded-full bg-mint-border px-1.5 py-0.5 text-[10px] font-bold text-mint" : "text-muted-foreground")}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "members" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex h-10 min-w-0 flex-1 items-center sm:w-72 sm:flex-none">
              <SearchIcon className="absolute left-3 size-[18px] text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members by name, email, or role..."
                aria-label="Search members"
                className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-[13px] shadow-[var(--shadow-1)] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20"
              />
            </label>
            <span className="relative">
              <select aria-label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleId | "all")} className={selectClass}>
                <option value="all">Role: All Roles</option>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
            </span>
            <span className="relative">
              <select aria-label="App scope" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value as AppScopeId | "all")} className={selectClass}>
                <option value="all">App Scope: All 8 Apps</option>
                {(Object.keys(APP_SCOPES) as AppScopeId[]).map((a) => (
                  <option key={a} value={a}>
                    {APP_SCOPES[a]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
            </span>
            <button
              type="button"
              disabled={!filtersOn}
              title="Clear filters"
              aria-label="Clear filters"
              onClick={() => {
                setQuery("")
                setRoleFilter("all")
                setScopeFilter("all")
              }}
              className="rounded-lg bg-card p-2.5 text-muted-foreground shadow-[var(--shadow-1)] hover:text-foreground disabled:opacity-50"
            >
              <FilterXIcon className="size-[18px]" />
            </button>
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6" role="tabpanel">
        {tab === "members" && (
          <Roster
            readOnly={!canManage}
            key={`${roleFilter}-${scopeFilter}-${q}`}
            members={filtered}
            total={members.length}
            onEdit={(m) => {
              setEditing(m)
              setEditKey((k) => k + 1)
            }}
            onResetAuth={(m) => log({ action: "reset 2FA enrollment for", target: m.name, meta: "Re-enrollment required at next sign-in", kind: "access" })}
            onRemove={(m) => {
              setMembers((list) => list.filter((x) => x.id !== m.id))
              log({ action: "removed from workspace:", target: m.name, meta: "All tokens revoked", kind: "access" })
            }}
          />
        )}
        {tab === "invites" && (
          <InvitesPanel
            readOnly={!canManage}
            invites={invites}
            onResend={(i) => log({ action: "re-sent invitation to", target: i.email, meta: "Link valid for 7 days", kind: "access" })}
            onRevoke={(i) => {
              setInvites((list) => list.filter((x) => x.id !== i.id))
              log({ action: "revoked invitation for", target: i.email, meta: "Link invalidated", kind: "access" })
            }}
          />
        )}
        {tab === "roles" && <PermissionMatrix />}
        {tab === "services" && (
          <ServicesPanel
            readOnly={!canManage}
            services={services}
            onRotate={(s) => {
              setServices((list) => list.map((x) => (x.id === s.id ? { ...x, status: "active" as const, expiresDays: 365, lastUsedMin: 0 } : x)))
              log({ action: "rotated key for", target: s.name, meta: "Previous key revoked after 5 min grace", kind: "key" })
            }}
          />
        )}
        {tab === "audit" && (
          <AuditPanel
            events={audit}
            filter={auditFilter}
            onFilter={setAuditFilter}
            onExport={() => exportAudit(auditFilter === "all" ? audit : audit.filter((e) => e.kind === auditFilter), `audit-log-${auditFilter}.csv`)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="min-w-0 @5xl/main:col-span-7">
          <RbacTiers members={members} onConfigure={() => setTab("roles")} />
        </div>
        <div className="min-w-0 @5xl/main:col-span-5">
          <AuditStream events={audit} total={totalAudit} onViewAll={() => setTab("audit")} />
        </div>
      </div>

      <InviteSheet
        key={`invite-${inviteOpen}`}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existingEmails={[...members.map((m) => m.email.toLowerCase()), ...invites.map((i) => i.email)]}
        onSend={(i) => {
          setInvites((list) => [{ ...i, id: `i-${Date.now().toString(36)}`, sentMin: 0, expiresDays: 7 }, ...list])
          log({ action: "invited", target: i.email, meta: `${roleOf(i.roleId).label} · 2FA enforced`, kind: "access" })
          setTab("invites")
        }}
      />
      <MemberSheet
        key={editKey}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        member={editing}
        onSave={(id, patch) => {
          const m = members.find((x) => x.id === id)
          setMembers((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)))
          if (m) log({ action: "updated access for", target: m.name, meta: `${roleOf(patch.roleId).label} · ${patch.scope === "all" ? "all apps" : `${patch.scope.length} app(s)`}`, kind: "access" })
        }}
      />
    </>
  )
}
