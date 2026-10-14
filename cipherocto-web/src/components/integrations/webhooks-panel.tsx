import * as React from "react"
import { CheckIcon, CopyIcon, Link2Icon, Loader2Icon, MoreVerticalIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Webhook } from "@/data/integrations"
import { cn } from "@/lib/utils"

const mask = (s: string) => `${s.slice(0, 10)}...${s.slice(-4)}`

export function WebhooksPanel({
  webhooks,
  testing,
  onNew,
  onTest,
  onLogs,
  onRotate,
  onTogglePause,
  onDelete,
}: {
  webhooks: Webhook[]
  testing: Set<string>
  onNew: () => void
  onTest: (w: Webhook) => void
  onLogs: (w: Webhook) => void
  onRotate: (w: Webhook) => void
  onTogglePause: (w: Webhook) => void
  onDelete: (w: Webhook) => void
}) {
  const [copied, setCopied] = React.useState<string | null>(null)

  const copy = async (w: Webhook) => {
    try {
      await navigator.clipboard.writeText(w.secret)
    } catch {
      /* clipboard may be unavailable; still show feedback */
    }
    setCopied(w.id)
    window.setTimeout(() => setCopied((c) => (c === w.id ? null : c)), 1500)
  }

  return (
    <section id="webhooks" className="mx-4 space-y-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)] lg:mx-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.015em] text-foreground">Active Webhook Endpoints</h2>
            <span className="rounded-full bg-neutral-strong px-2 py-0.5 text-[11px] font-bold">{webhooks.filter((w) => !w.paused).length} Live Destinations</span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Real-time outbound HTTPS push notifications with HMAC SHA-256 integrity verification signatures.
          </p>
        </div>
        <button type="button" onClick={onNew} className="flex items-center gap-1.5 self-start rounded-xl bg-foreground/[0.06] px-4 py-2 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.1] sm:self-auto">
          <Link2Icon className="size-4" />
          New Webhook Endpoint
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-background text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
              <th className="px-4 py-3">Destination &amp; URL</th>
              <th className="px-4 py-3">Subscribed Event Types</th>
              <th className="px-4 py-3">Signing Secret (HMAC)</th>
              <th className="px-4 py-3">Delivery SLA</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {webhooks.map((w) => (
              <tr key={w.id} className={cn("transition-colors hover:bg-foreground/[0.02]", w.paused && "opacity-70")}>
                <td className="px-4 py-4">
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className={cn("size-2 rounded-full", w.paused ? "bg-amber" : "bg-stream-mrr")} />
                    {w.name}
                    {w.paused && <span className="rounded bg-amber-hover px-1.5 text-[10px] font-bold text-amber">PAUSED</span>}
                  </p>
                  <p className="mt-0.5 max-w-xs truncate font-mono text-xs text-muted-foreground" title={w.url}>
                    {w.url}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className="flex max-w-sm flex-wrap gap-1">
                    {w.events.map((e) => (
                      <span key={e} className={cn("rounded-md px-2 py-0.5 font-mono text-[11px]", e.includes("crash") ? "bg-pink-hover text-pink" : "bg-neutral-strong text-foreground")}>
                        {e}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1">
                    <span className="font-mono text-xs">{mask(w.secret)}</span>
                    <button type="button" title="Copy secret" aria-label={`Copy signing secret for ${w.name}`} onClick={() => copy(w)} className="text-muted-foreground hover:text-foreground">
                      {copied === w.id ? <CheckIcon className="size-3.5 text-mint" /> : <CopyIcon className="size-3.5" />}
                    </button>
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-mono text-xs font-semibold text-foreground">{w.sla}</p>
                  <p className="text-xs text-mint">{w.latency}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      disabled={testing.has(w.id) || w.paused}
                      onClick={() => onTest(w)}
                      className="flex items-center gap-1 rounded-lg bg-background px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] hover:bg-foreground/[0.06] disabled:opacity-50"
                    >
                      {testing.has(w.id) && <Loader2Icon className="size-3 animate-spin" />}
                      Test
                    </button>
                    <button type="button" onClick={() => onLogs(w)} className="rounded-lg bg-background px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] hover:bg-foreground/[0.06]">
                      Logs
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label={`More actions for ${w.name}`} className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
                          <MoreVerticalIcon className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRotate(w)}>Rotate signing secret</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onTogglePause(w)}>{w.paused ? "Resume deliveries" : "Pause deliveries"}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(w)}>
                          Delete endpoint
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </td>
              </tr>
            ))}
            {webhooks.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No webhook endpoints yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
