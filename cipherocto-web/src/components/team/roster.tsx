import * as React from "react"
import { ArrowUpDownIcon, InfinityIcon, MoreVerticalIcon, SlidersHorizontalIcon, BadgeCheckIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { APP_SCOPES, initials, lastActiveLabel, roleOf, type Member } from "@/data/team"
import { cn } from "@/lib/utils"

const TITLE_TONE: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  release: "bg-mint-border text-mint",
  dev: "bg-blue-hover text-tertiary",
  product: "bg-lavender-hover text-lavender",
  finance: "bg-amber-hover text-amber",
  analyst: "bg-neutral-strong text-foreground",
}

const AVATAR_TONE = ["bg-blue-hover text-tertiary", "bg-mint-hover text-mint", "bg-lavender-hover text-lavender", "bg-amber-hover text-amber", "bg-pink-hover text-pink", "bg-neutral-strong text-foreground"]

export function MemberAvatar({ member }: { member: Member }) {
  const idx = member.name.length % AVATAR_TONE.length
  return (
    <span className="relative">
      <span className={cn("flex size-10 items-center justify-center rounded-full text-sm font-bold shadow-[var(--shadow-1)]", AVATAR_TONE[idx])}>{initials(member.name)}</span>
      <span
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-card",
          member.lastMin === 0 ? "bg-mint" : member.lastMin < 120 ? "bg-mint-border" : "bg-neutral-deep"
        )}
      />
    </span>
  )
}

const PAGE_SIZE = 6

export function Roster({
  members,
  total,
  onEdit,
  onResetAuth,
  onRemove,
}: {
  members: Member[]
  total: number
  onEdit: (m: Member) => void
  onResetAuth: (m: Member) => void
  onRemove: (m: Member) => void
}) {
  const [sort, setSort] = React.useState<"recent" | "name">("recent")
  const [page, setPage] = React.useState(1)

  const sorted = [...members].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a.lastMin - b.lastMin))
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const from = sorted.length ? (current - 1) * PAGE_SIZE + 1 : 0

  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2 bg-foreground/[0.03] px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Organization Roster</h2>
          <span className="rounded-full bg-mint-border px-2 py-0.5 text-[11px] font-bold text-mint">{total} Members</span>
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === "recent" ? "name" : "recent"))}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Sort by: <strong className="text-foreground">{sort === "recent" ? "Activity (Recent)" : "Name (A–Z)"}</strong>
          <ArrowUpDownIcon className="size-3.5" />
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-foreground/[0.02] text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="px-6 py-4" scope="col">Member</th>
              <th className="px-4 py-4" scope="col">Primary Role</th>
              <th className="px-4 py-4" scope="col">App Scope</th>
              <th className="px-4 py-4" scope="col">2FA &amp; Auth</th>
              <th className="px-4 py-4" scope="col">Last Active</th>
              <th className="px-6 py-4 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-foreground/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={m} />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-bold text-foreground">{m.name}</span>
                        {m.keyBound && <BadgeCheckIcon className="size-4 shrink-0 text-mint" aria-label="Hardware key bound" />}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", TITLE_TONE[m.roleId])} title={roleOf(m.roleId).label}>
                    {m.title}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {m.scope === "all" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-mint-surface px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-mint">
                      <InfinityIcon className="size-3.5" />
                      All 8 Portfolio Apps
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="rounded-md bg-foreground/[0.05] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">{APP_SCOPES[m.scope[0]]}</span>
                      {m.scope.length > 1 && (
                        <span className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[11px] text-muted-foreground" title={m.scope.slice(1).map((s) => APP_SCOPES[s]).join(", ")}>
                          +{m.scope.length - 1} app{m.scope.length > 2 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                    <span className="size-2 rounded-full bg-mint" />
                    {m.auth}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs whitespace-nowrap">
                  {m.lastMin === 0 ? (
                    <span className="flex items-center gap-1 font-bold text-mint">
                      <span className="size-1.5 rounded-full bg-mint motion-safe:animate-pulse" />
                      Active now
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{lastActiveLabel(m.lastMin)}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1">
                    <button type="button" title="Edit Permissions" aria-label={`Edit permissions for ${m.name}`} onClick={() => onEdit(m)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                      <SlidersHorizontalIcon className="size-[18px]" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" title="More Options" aria-label={`More options for ${m.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                          <MoreVerticalIcon className="size-[18px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(m)}>Edit permissions</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onResetAuth(m)}>Reset 2FA enrollment</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onRemove(m)}>
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No members match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col justify-between gap-2 bg-foreground/[0.03] px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          Showing <strong className="text-foreground">{from} - {from + visible.length - (visible.length ? 1 : 0)}</strong> of{" "}
          <strong className="text-foreground">{sorted.length}</strong> team members
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-lg bg-card px-3 py-1.5 text-[11px] font-bold text-foreground shadow-[var(--shadow-1)] disabled:opacity-50">
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === current ? "page" : undefined}
              onClick={() => setPage(n)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-bold shadow-[var(--shadow-1)]",
                n === current ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-foreground/[0.05]"
              )}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)} className="rounded-lg bg-card px-3 py-1.5 text-[11px] font-bold text-foreground shadow-[var(--shadow-1)] disabled:opacity-50">
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}
