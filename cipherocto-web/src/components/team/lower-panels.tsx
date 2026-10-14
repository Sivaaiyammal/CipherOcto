import { HistoryIcon, ShieldUserIcon } from "lucide-react"

import { ageLabel, KIND_DOT, ROLES, type AuditEvent, type Member } from "@/data/team"
import { cn } from "@/lib/utils"

export function RbacTiers({ members, onConfigure }: { members: Member[]; onConfigure: () => void }) {
  return (
    <section className="flex min-w-0 flex-col justify-between gap-6 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-[0.04em] text-mint uppercase">Access Hierarchy</p>
            <h2 className="text-lg font-bold text-foreground">Role-Based Access Control (RBAC) Matrix</h2>
          </div>
          <span className="rounded-full bg-mint-border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-mint">Dynamic IAM Rules</span>
        </header>
        <p className="text-[13px] text-muted-foreground">
          Granular access levels enforcing least-privilege architecture across mobile production clusters, App Store Connect distribution,
          and telemetry endpoints.
        </p>
        <ul className="space-y-2">
          {ROLES.map((r) => {
            const n = members.filter((m) => m.roleId === r.id).length
            return (
              <li key={r.id} className="flex flex-col justify-between gap-2 rounded-xl bg-background p-4 transition-colors hover:bg-foreground/[0.05] sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground">{r.label}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", r.badgeClass)}>{r.badge}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                <span className="shrink-0 self-start rounded bg-card px-2 py-1 text-[11px] font-bold whitespace-nowrap shadow-[var(--shadow-1)] sm:self-auto">
                  {n} User{n === 1 ? "" : "s"}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <button
        type="button"
        onClick={onConfigure}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground/[0.04] py-2.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.08]"
      >
        <ShieldUserIcon className="size-4" />
        Configure Custom Roles &amp; Policy Rules
      </button>
    </section>
  )
}

export function AuditStream({ events, total, onViewAll }: { events: AuditEvent[]; total: number; onViewAll: () => void }) {
  return (
    <section className="flex min-w-0 flex-col justify-between gap-6 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-[0.04em] text-destructive uppercase">Live Telemetry</p>
            <h2 className="text-lg font-bold text-foreground">Security &amp; Audit Trail</h2>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-mint">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-mint opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            Active Stream
          </span>
        </header>
        <p className="text-[13px] text-muted-foreground">
          Immutable cryptographic audit logs tracking all credential exchanges, role modifications, and production pushes.
        </p>
        <ol aria-live="polite" className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-border">
          {events.slice(0, 4).map((e) => (
            <li key={e.id} className="relative">
              <span className={cn("absolute top-1 -left-6 size-2.5 rounded-full ring-4 ring-card", KIND_DOT[e.kind])} />
              <p className="text-[13px] text-foreground">
                <strong className="font-semibold">{e.actor}</strong> {e.action} {e.target && <strong className="font-semibold">{e.target}</strong>}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                <span>{ageLabel(e.ageMin)}</span>
                <span>•</span>
                <span className={e.meta.includes("2FA") ? "font-semibold text-mint" : undefined}>{e.meta}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground/[0.04] py-2.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.08]"
      >
        <HistoryIcon className="size-4" />
        View Full Audit Trail ({total.toLocaleString("en-US")} events)
      </button>
    </section>
  )
}
