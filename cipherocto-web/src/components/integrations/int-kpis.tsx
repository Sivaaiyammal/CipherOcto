import { BadgeCheckIcon, BoltIcon, KeyRoundIcon, Link2Icon, RefreshCwIcon, TimerIcon, ShieldCheckIcon, FileClockIcon } from "lucide-react"

import type { ApiKey, Integration, Webhook } from "@/data/integrations"

export function IntegrationKpis({ integrations, webhooks, keys }: { integrations: Integration[]; webhooks: Webhook[]; keys: ApiKey[] }) {
  const connected = integrations.filter((i) => i.status !== "paused")
  const paused = integrations.length - connected.length
  const names = integrations
    .filter((i) => i.status !== "paused")
    .slice(0, 4)
    .map((i) => i.name.split(" ")[0])
    .join(", ")
  const live = webhooks.filter((w) => !w.paused).length

  return (
    <section aria-label="Integration health" className="grid grid-cols-1 gap-5 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <article className="relative flex flex-col justify-between overflow-hidden rounded-[18px] bg-mint-surface p-6 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold tracking-[0.04em] text-mint uppercase">Active Integrations</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-mint-border text-mint">
            <Link2Icon className="size-[18px]" />
          </span>
        </header>
        <div className="my-4">
          <p className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">{connected.length} Connected</p>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{names || "Nothing connected"}</p>
        </div>
        <p className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] ${paused ? "bg-amber-hover text-amber" : "bg-mint-border text-mint"}`}>
            <span className={`size-1.5 rounded-full ${paused ? "bg-amber" : "bg-stream-mrr"}`} />
            {paused ? `${paused} paused` : "100% Passing"}
          </span>
          <span className="text-xs text-muted-foreground">{paused ? "Review paused connectors" : "All health checks nominal"}</span>
        </p>
      </article>

      <article className="relative flex flex-col justify-between overflow-hidden rounded-[18px] bg-lavender-surface p-6 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold tracking-[0.04em] text-lavender uppercase">Webhook Delivery</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-lavender-hover text-lavender">
            <BoltIcon className="size-[18px]" />
          </span>
        </header>
        <div className="my-4">
          <p className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">
            99.992% <span className="text-[13px] font-normal text-muted-foreground">SLA</span>
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">4.2M events dispatched today</p>
        </div>
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] shadow-[var(--shadow-1)]">
            <TimerIcon className="size-3.5 text-mint" />
            18ms Latency
          </span>
          <span className="text-xs text-muted-foreground">
            p99 avg dispatch · {live}/{webhooks.length} live
          </span>
        </p>
      </article>

      <article className="relative flex flex-col justify-between overflow-hidden rounded-[18px] bg-neutral-strong p-6 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold tracking-[0.04em] text-foreground uppercase">Event Retries &amp; DLQ</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-card/70 text-foreground">
            <RefreshCwIcon className="size-[18px]" />
          </span>
        </header>
        <div className="my-4">
          <p className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">12 Retries</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">0 Dead Letter Queue drops</p>
        </div>
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-mint">
            <FileClockIcon className="size-3.5" />
            Auto-replay armed
          </span>
          <span className="text-xs text-muted-foreground">Exp. backoff</span>
        </p>
      </article>

      <article className="relative flex flex-col justify-between overflow-hidden rounded-[18px] bg-blue-surface p-6 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold tracking-[0.04em] text-tertiary uppercase">API Keys &amp; Enclaves</h3>
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-hover text-tertiary">
            <KeyRoundIcon className="size-[18px]" />
          </span>
        </header>
        <div className="my-4">
          <p className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">{keys.length} Active Keys</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">CloudHSM rotated 2d ago</p>
        </div>
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] shadow-[var(--shadow-1)]">
            <BadgeCheckIcon className="size-3.5 text-mint" />
            0 Leaks Detected
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-3.5" />
            Enclave active
          </span>
        </p>
      </article>
    </section>
  )
}
