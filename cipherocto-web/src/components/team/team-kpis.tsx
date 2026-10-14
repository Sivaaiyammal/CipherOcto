import { CloudIcon, KeyRoundIcon, ShieldCheckIcon, TrendingUpIcon, UsersIcon, BadgeCheckIcon, CircleCheckIcon } from "lucide-react"

import { ROLES, type Invite, type Member } from "@/data/team"

export function TeamKpis({ members, invites }: { members: Member[]; invites: Invite[] }) {
  const count = (id: string) => members.filter((m) => m.roleId === id).length
  const eng = count("dev") + count("release")
  const design = count("product")

  return (
    <section aria-label="Team metrics" className="grid grid-cols-1 gap-5 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <article className="flex flex-col justify-between rounded-2xl bg-blue-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-tertiary uppercase">Total Members</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground tabular-nums">{members.length} Active</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-blue-hover text-tertiary">
            <UsersIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-1.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-card px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] shadow-[var(--shadow-1)]">
              <TrendingUpIcon className="size-3.5 text-mint" />
              +4 this quarter
            </span>
            <span className="text-xs text-muted-foreground">{invites.length} pending invites</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {count("admin")} Org Admins, {eng} Engineers, {design} Product &amp; Design
          </p>
        </div>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-mint-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-mint uppercase">Granular Roles &amp; RBAC</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">{ROLES.length} Custom Roles</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-mint-border text-mint">
            <ShieldCheckIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-1.5">
          <p>
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-white">
              <span className="size-1.5 rounded-full bg-mint-border" />
              Enforced 2FA (100%)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Zero-trust privilege policy active</p>
        </div>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-neutral-strong p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-foreground uppercase">Store Access Sync</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">Sync Healthy</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-card/70 text-foreground">
            <CloudIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-1.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] shadow-[var(--shadow-1)]">
              <CircleCheckIcon className="size-3 text-mint" />
              StoreKit 2 Keys Active
            </span>
            <span className="text-xs text-muted-foreground">Apple &amp; Google</span>
          </p>
          <p className="text-xs text-muted-foreground">Automatic token refresh 12m ago</p>
        </div>
      </article>

      <article className="flex flex-col justify-between rounded-2xl bg-pink-surface p-6 shadow-[var(--shadow-1)] transition-transform hover:-translate-y-0.5">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.04em] text-pink uppercase">Security &amp; Enclaves</h3>
            <p className="mt-1 text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">0 Violations</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-pink-hover text-pink">
            <KeyRoundIcon className="size-5" />
          </span>
        </header>
        <div className="mt-4 space-y-1.5">
          <p>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] shadow-[var(--shadow-1)]">
              <BadgeCheckIcon className="size-3 text-mint" />
              FIPS 140-3 Compliant
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Hardware 2FA / WebAuthn Enforced</p>
        </div>
      </article>
    </section>
  )
}
