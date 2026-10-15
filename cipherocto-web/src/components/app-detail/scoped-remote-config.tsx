import * as React from "react"
import { Link } from "react-router-dom"
import { ListFilterIcon, ToggleRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getScopedFlags } from "@/data/app-details"
import type { PortfolioApp } from "@/data/apps"

export function ScopedRemoteConfig({ app }: { app: PortfolioApp }) {
  const flags = React.useMemo(() => getScopedFlags(), [])
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(flags.map((f) => [f.key, f.enabled]))
  )

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
            <ToggleRightIcon className="size-4.5 text-mint" />
            Scoped Remote Config
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Live flags scoped to {app.name}
          </p>
        </div>
        <Link
          to={`/remote-config?app=${app.id}`}
          className="shrink-0 text-xs font-semibold text-mint hover:underline"
        >
          {app.configFlags === null ? "All Flags" : `All ${app.configFlags} Flags`} →
        </Link>
      </header>

      <ul className="flex flex-col gap-2.5">
        {flags.length === 0 && (
          <li className="rounded-xl bg-background p-3 text-xs text-muted-foreground">
            No flags yet. Remote config isn&apos;t connected to a backend module.
          </li>
        )}
        {flags.map((flag) => {
          const id = `${app.id}-${flag.key}`
          return (
            <li key={flag.key} className="flex items-center gap-3 rounded-xl bg-background p-3">
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="font-mono text-[13px] font-semibold text-foreground">
                  {flag.key}
                </label>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{flag.description}</p>
              </div>
              <Switch
                id={id}
                checked={enabled[flag.key]}
                onCheckedChange={(checked) => setEnabled((prev) => ({ ...prev, [flag.key]: checked }))}
                className="data-[state=checked]:bg-stream-mrr data-[state=unchecked]:bg-neutral-deep"
              />
            </li>
          )
        })}
      </ul>

      <Button
        asChild
        variant="ghost"
        className="h-10 rounded-xl bg-foreground/[0.04] text-[13px] font-semibold hover:bg-foreground/[0.08]"
      >
        <Link to={`/remote-config?app=${app.id}&tab=targeting`}>
          <ListFilterIcon />
          Manage Audience Targeting Rules
        </Link>
      </Button>
    </section>
  )
}
