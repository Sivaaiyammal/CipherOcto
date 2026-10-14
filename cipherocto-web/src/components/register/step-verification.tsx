import * as React from "react"
import {
  BadgeCheckIcon,
  CheckIcon,
  CircleCheckIcon,
  CopyIcon,
  Loader2Icon,
  PlayIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Pill } from "@/components/register/fields"
import type { RegisterDraft } from "@/data/register"
import { CHECKS, type Target, type Verification } from "@/hooks/use-verification"
import { cn } from "@/lib/utils"

function ProbeCard({
  target,
  v,
  icon,
  title,
  subtitle,
  rows,
}: {
  target: Target
  v: Verification
  icon: React.ReactNode
  title: string
  subtitle: string
  rows: [string, string][]
}) {
  const st = v.status[target]
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-strong text-foreground [&_svg]:size-5">{icon}</span>
            <div>
              <h3 className="text-lg leading-[26px] font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {st === "pass" ? <Pill tone="mint">Pass (200 OK)</Pill> : st === "running" ? <Pill tone="blue">Running…</Pill> : <Pill>Queued</Pill>}
        </div>
        <dl className="space-y-1 rounded-xl bg-background p-2.5 text-xs">
          {rows.map(([k, val]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="max-w-[60%] truncate font-mono text-[11px] font-semibold text-foreground" title={val}>
                {val}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="space-y-1.5 text-[13px] text-foreground">
          {CHECKS[target].map((label, i) => {
            const done = v.progress[target] > i
            const active = st === "running" && v.progress[target] === i
            return (
              <li key={label} className={cn("flex items-center gap-2", !done && !active && "text-muted-foreground")}>
                {done ? (
                  <CircleCheckIcon className="size-4 text-mint" />
                ) : active ? (
                  <Loader2Icon className="size-4 animate-spin text-tertiary" />
                ) : (
                  <span className="size-4 rounded-full border-2 border-neutral-deep" />
                )}
                {label}
                {label.includes("ping") && done && v.latency[target] > 0 && ` (${v.latency[target]}ms)`}
              </li>
            )
          })}
        </ul>
      </div>
      <button
        type="button"
        disabled={st === "running"}
        onClick={() => v.run(target)}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-foreground/[0.05] text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.09] disabled:opacity-60"
      >
        {st === "running" ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
        {st === "running" ? `Validating ${title}…` : `Re-run ${title.split(" ")[0]} Ping`}
      </button>
    </div>
  )
}

export function StepVerification({ draft, v }: { draft: RegisterDraft; v: Verification }) {
  const [copied, setCopied] = React.useState(false)
  const logRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [v.log.length])

  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  const passed = v.targets.filter((t) => v.status[t] === "pass").length
  const health = v.targets.length ? Math.round((passed / v.targets.length) * 100) : 0

  const ribbon: { label: string; value: string; note: string }[] = [
    { label: "Apple StoreKit 2", value: draft.ios.enabled ? (v.latency.apple ? `${v.latency.apple}ms` : "—") : "Off", note: "TLS 1.3" },
    { label: "Google Pub/Sub", value: draft.android.enabled ? (v.latency.google ? `${v.latency.google}ms` : "—") : "Off", note: "ACK'd" },
    { label: "Webhook Gateway", value: draft.webhook.url ? (v.latency.webhook ? `${v.latency.webhook}ms` : "—") : "Skipped", note: draft.env.hmac ? "HMAC-256" : "Unsigned" },
    { label: "Health Index", value: `${health}%`, note: `${passed}/${v.targets.length} Valid` },
  ]

  return (
    <>
      <div className={cn("space-y-4 rounded-2xl p-6 shadow-[var(--shadow-1)]", v.allPassed ? "bg-mint-surface" : "bg-blue-surface")}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full shadow-[var(--shadow-1)] [&_svg]:size-6",
                v.allPassed ? "bg-mint-hover text-mint" : "bg-blue-hover text-tertiary"
              )}
            >
              {v.allPassed ? <BadgeCheckIcon /> : <Loader2Icon className="animate-spin" />}
            </span>
            <div>
              <h2 className="text-lg leading-[26px] font-bold text-foreground">
                {v.allPassed ? "All Systems Verified & Cryptographically Signed" : "Running verification probes…"}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {[draft.ios.enabled && "StoreKit 2 server API", draft.android.enabled && "Google Play RTDN topic", draft.webhook.url && "webhook endpoint"]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          {v.allPassed && <Pill tone="solid-mint" className="self-start px-3 py-1 uppercase sm:self-auto">Ready for Production</Pill>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ribbon.map((r) => (
            <div key={r.label} className="rounded-xl bg-card p-2.5 shadow-[var(--shadow-1)]">
              <span className="block text-xs text-muted-foreground">{r.label}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground tabular-nums">{r.value}</span>
                <span className="text-[11px] font-bold text-mint">{r.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2">
        {draft.ios.enabled && (
          <ProbeCard
            target="apple"
            v={v}
            icon={<SmartphoneIcon />}
            title="Apple StoreKit 2"
            subtitle="V2 App Store Server API"
            rows={[
              ["Bundle ID", draft.ios.bundleId],
              ["Key ID / Issuer", `${draft.ios.keyId} / ${draft.ios.issuerId.slice(0, 8)}…`],
              ["Apple ID", draft.ios.appleId],
            ]}
          />
        )}
        {draft.android.enabled && (
          <ProbeCard
            target="google"
            v={v}
            icon={<PlayIcon />}
            title="Google Play RTDN"
            subtitle="Cloud Pub/Sub & In-App API"
            rows={[
              ["Package ID", draft.android.packageName],
              ["Service Account", draft.android.serviceAccountEmail ?? "—"],
              ["Pub/Sub Topic", draft.android.topic],
            ]}
          />
        )}
      </div>

      <div className="space-y-2 rounded-2xl bg-primary p-4 font-mono text-primary-foreground shadow-[var(--shadow-2)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-3 rounded-full bg-destructive" />
              <span className="size-3 rounded-full bg-mint-border" />
              <span className="size-3 rounded-full bg-sidebar-foreground" />
            </span>
            <span className="truncate font-sans text-[13px] font-bold">Ping &amp; Signature Verification Stream</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-sidebar-foreground uppercase">
              Simulated
            </span>
          </div>
          <button
            type="button"
            title="Copy raw log"
            onClick={() =>
              navigator.clipboard
                ?.writeText(v.log.map((l) => `[${l.time}] ${l.tag} ${l.text}`).join("\n"))
                .then(() => setCopied(true), () => undefined)
            }
            className="shrink-0 rounded-lg bg-white/10 p-1.5 text-sidebar-foreground hover:bg-white/20 hover:text-white"
          >
            {copied ? <CheckIcon className="size-4 text-mint-border" /> : <CopyIcon className="size-4" />}
          </button>
        </div>
        <div ref={logRef} className="max-h-60 space-y-1 overflow-auto rounded-xl bg-black/30 p-2.5 text-xs leading-relaxed text-sidebar-foreground">
          {v.log.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0 text-white/40 select-none">[{l.time}]</span>
              <span className="w-16 shrink-0 font-bold text-mint-border">{l.tag}</span>
              <span className={cn("min-w-0 break-all", l.strong && "font-semibold text-mint-border")}>{l.text}</span>
            </div>
          ))}
          {v.anyRunning && <div className="animate-pulse text-white/50">▍</div>}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-1)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShieldCheckIcon className="size-5 text-mint" />
            Security &amp; Compliance
          </span>
          <span className="text-xs font-bold tracking-[0.04em] text-mint uppercase">Zero-Trust</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ["Transport", "TLS 1.3 only", "Older protocols rejected"],
            ["Credential Storage", "Encrypted at rest", "Keys never leave the vault"],
            ["Payload Security", draft.env.hmac ? "HMAC-SHA256 signed" : "Signature off", draft.env.hmac ? "Replay protection active" : "Enable in Step 1"],
          ].map(([k, val, note]) => (
            <div key={k} className="rounded-xl bg-background p-2.5">
              <span className="block text-xs text-muted-foreground">{k}</span>
              <span className="mt-1 block text-[13px] font-semibold text-foreground">{val}</span>
              <span className="text-xs font-medium text-mint">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
