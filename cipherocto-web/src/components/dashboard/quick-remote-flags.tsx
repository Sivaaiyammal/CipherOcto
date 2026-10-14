import * as React from "react"
import { SlidersHorizontalIcon } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import {
  QUICK_FLAGS,
  TOTAL_FLAGS,
  type RemoteFlag,
} from "@/components/dashboard/apps-data"
import { cn } from "@/lib/utils"

const BADGE_TONE: Record<RemoteFlag["badge"]["tone"], string> = {
  mint: "bg-mint-border/70 text-mint",
  stone: "bg-neutral-deep text-foreground/80",
  outline: "bg-card text-muted-foreground shadow-[0_0_0_1px_var(--border)]",
}

export function QuickRemoteFlags() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(QUICK_FLAGS.map((f) => [f.key, f.enabled]))
  )

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
          Quick Remote Flags
        </h2>
        <a
          href="#"
          className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Manage All ({TOTAL_FLAGS})
        </a>
      </header>

      <ul className="flex flex-col gap-2.5">
        {QUICK_FLAGS.map((flag) => {
          const id = `flag-${flag.key}`
          return (
            <li
              key={flag.key}
              className="flex items-center gap-3 rounded-xl bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <label
                    htmlFor={id}
                    className="font-mono text-[13px] font-semibold text-foreground"
                  >
                    {flag.key}
                  </label>
                  <span
                    className={cn(
                      "rounded px-1.5 py-px text-[10px] font-bold tracking-[0.04em] uppercase",
                      BADGE_TONE[flag.badge.tone]
                    )}
                  >
                    {flag.badge.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {flag.description}
                </p>
              </div>
              <Switch
                id={id}
                checked={enabled[flag.key]}
                onCheckedChange={(checked) =>
                  setEnabled((prev) => ({ ...prev, [flag.key]: checked }))
                }
                className="data-[state=checked]:bg-stream-mrr data-[state=unchecked]:bg-neutral-deep"
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
