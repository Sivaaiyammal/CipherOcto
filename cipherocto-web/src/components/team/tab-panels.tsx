import { CheckIcon, MinusIcon, EyeIcon, RefreshCwIcon } from "lucide-react"

import {
  ageLabel,
  KIND_DOT,
  KIND_LABEL,
  PERMISSIONS,
  ROLES,
  roleOf,
  scopeLabel,
  type AuditEvent,
  type AuditKind,
  type Invite,
  type ServiceAccount,
} from "@/data/team"
import { cn } from "@/lib/utils"

const card = "overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-1)]"
const th = "px-5 py-3 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase"

export function InvitesPanel({ invites, onResend, onRevoke }: { invites: Invite[]; onResend: (i: Invite) => void; onRevoke: (i: Invite) => void }) {
  return (
    <section className={card}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="bg-foreground/[0.03]">
              <th className={th}>Invitee</th>
              <th className={th}>Role</th>
              <th className={th}>App scope</th>
              <th className={th}>Sent</th>
              <th className={cn(th, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invites.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3.5 font-semibold text-foreground">{i.email}</td>
                <td className="px-5 py-3.5">{roleOf(i.roleId).label}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{scopeLabel(i.scope)}</td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted-foreground">
                  {ageLabel(i.sentMin)} · expires in {i.expiresDays}d
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button type="button" onClick={() => onResend(i)} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-foreground/[0.06]">
                    Resend
                  </button>
                  <button type="button" onClick={() => onRevoke(i)} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-pink-surface">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No pending invitations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ServicesPanel({ services, onRotate }: { services: ServiceAccount[]; onRotate: (s: ServiceAccount) => void }) {
  return (
    <section className={card}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="bg-foreground/[0.03]">
              <th className={th}>Service account</th>
              <th className={th}>Type</th>
              <th className={th}>Scope</th>
              <th className={th}>Last used</th>
              <th className={th}>Expires</th>
              <th className={cn(th, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3.5 font-semibold text-foreground">{s.name}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{s.kind}</td>
                <td className="px-5 py-3.5">{s.scope}</td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted-foreground">{s.lastUsedMin < 1 ? "just now" : ageLabel(s.lastUsedMin)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
                      s.status === "rotating" ? "bg-amber-hover text-amber" : s.expiresDays <= 30 ? "bg-amber-hover text-amber" : "bg-mint-border text-mint"
                    )}
                  >
                    {s.status === "rotating" ? "Rotation due" : `${s.expiresDays} days`}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onRotate(s)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-foreground/[0.06]"
                  >
                    <RefreshCwIcon className="size-3.5" />
                    Rotate key
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function AuditPanel({ events, filter, onFilter, onExport }: { events: AuditEvent[]; filter: AuditKind | "all"; onFilter: (k: AuditKind | "all") => void; onExport: () => void }) {
  const kinds: (AuditKind | "all")[] = ["all", "access", "key", "deploy", "system"]
  const shown = filter === "all" ? events : events.filter((e) => e.kind === filter)
  return (
    <section className={card}>
      <header className="flex flex-wrap items-center justify-between gap-2 bg-foreground/[0.03] px-5 py-3">
        <div role="radiogroup" aria-label="Event type" className="flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={filter === k}
              onClick={() => onFilter(k)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.04em]",
                filter === k ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {k === "all" ? "All events" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onExport} className="text-xs font-semibold text-mint hover:underline">
          Export filtered (CSV)
        </button>
      </header>
      <ul className="divide-y divide-border/60">
        {shown.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-5 py-3.5 text-[13px]">
            <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", KIND_DOT[e.kind])} />
            <div className="min-w-0">
              <p>
                <strong className="font-semibold">{e.actor}</strong> {e.action} {e.target && <em className="not-italic font-semibold">{e.target}</em>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {ageLabel(e.ageMin)} • {e.meta}
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">{KIND_LABEL[e.kind]}</span>
          </li>
        ))}
        {shown.length === 0 && <li className="py-12 text-center text-sm text-muted-foreground">No events of this type.</li>}
      </ul>
    </section>
  )
}

export function PermissionMatrix() {
  return (
    <section className={card}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="bg-foreground/[0.03]">
              <th className={th}>Permission</th>
              {ROLES.map((r) => (
                <th key={r.id} className={cn(th, "text-center normal-case")}>
                  {r.label.split(" / ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td className="px-5 py-3.5 font-semibold text-foreground">{p}</td>
                {ROLES.map((r) => {
                  const g = r.grants[p]
                  return (
                    <td key={r.id} className="px-5 py-3.5 text-center">
                      <span
                        title={g === "full" ? "Full access" : g === "view" ? "View only" : "No access"}
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full",
                          g === "full" ? "bg-mint-border text-mint" : g === "view" ? "bg-blue-hover text-tertiary" : "bg-foreground/[0.05] text-muted-foreground"
                        )}
                      >
                        {g === "full" ? <CheckIcon className="size-3.5" /> : g === "view" ? <EyeIcon className="size-3.5" /> : <MinusIcon className="size-3.5" />}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
