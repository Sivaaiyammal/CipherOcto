import * as React from "react"
import { BadgeCheckIcon, CheckIcon, CopyIcon, LockKeyholeIcon, PlusIcon } from "lucide-react"

import type { ApiKey } from "@/data/integrations"
import { cn } from "@/lib/utils"

const ENV_TONE: Record<ApiKey["env"], string> = {
  Production: "bg-mint-border text-mint",
  Sandbox: "bg-blue-hover text-tertiary",
  Automations: "bg-neutral-strong text-foreground",
}

export function KeysPanel({ keys, onGenerate, onRotate, readOnly = false }: { keys: ApiKey[]; onGenerate: () => void; onRotate: (k: ApiKey) => void; readOnly?: boolean }) {
  const [copied, setCopied] = React.useState<string | null>(null)
  const copy = async (k: ApiKey) => {
    try {
      await navigator.clipboard.writeText(k.value)
    } catch {
      /* ignore */
    }
    setCopied(k.id)
    window.setTimeout(() => setCopied((c) => (c === k.id ? null : c)), 1500)
  }

  return (
    <section className="min-w-0 space-y-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Platform API Access Keys</h3>
          <p className="text-[13px] text-muted-foreground">Server SDK tokens for remote config overrides, entitlement checks, and automated CI pipelines.</p>
        </div>
        <button type="button" disabled={readOnly} onClick={onGenerate} className="disabled:cursor-not-allowed disabled:opacity-40 flex shrink-0 items-center gap-1 self-start rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90 sm:self-auto">
          <PlusIcon className="size-4" />
          Generate Key
        </button>
      </header>

      <ul className="space-y-2">
        {keys.map((k) => (
          <li key={k.id} className="flex flex-col justify-between gap-3 rounded-xl bg-background p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">{k.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", ENV_TONE[k.env])}>{k.env}</span>
              </p>
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="truncate">{k.value}</span>
                <button type="button" aria-label={`Copy ${k.name}`} onClick={() => copy(k)} className="hover:text-foreground">
                  {copied === k.id ? <CheckIcon className="size-3.5 text-mint" /> : <CopyIcon className="size-3.5" />}
                </button>
              </p>
              <p className="flex flex-wrap gap-1.5 pt-1">
                {k.scopes.map((s) => (
                  <span key={s} className="rounded bg-card px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    {s}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-col sm:items-end">
              <span>{k.used}</span>
              <button type="button" disabled={readOnly} onClick={() => onRotate(k)} className="disabled:cursor-not-allowed disabled:opacity-40 text-[11px] font-bold text-tertiary hover:underline">
                Rotate Key
              </button>
            </div>
          </li>
        ))}
        {keys.length === 0 && <li className="rounded-xl bg-background p-8 text-center text-sm text-muted-foreground">No API keys. Generate one to get started.</li>}
      </ul>
    </section>
  )
}

export function HsmPanel({ onAttest }: { onAttest: () => void }) {
  return (
    <section className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-mint-border text-mint">
            <LockKeyholeIcon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-lg leading-6 font-semibold text-foreground">CloudHSM Hardware Enclave</h3>
            <p className="text-xs text-muted-foreground">FIPS 140-2 Level 3 Hardware Security</p>
          </div>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          All webhook signatures, StoreKit 2 private signing keys, and external OAuth grant tokens are isolated inside a dedicated AWS
          CloudHSM cluster with zero plain-text disk serialization.
        </p>
        <dl className="mt-4 space-y-2 rounded-xl bg-background p-4 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Hardware Cluster</dt>
            <dd className="font-mono font-semibold text-foreground">us-east-1-hsm-04</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Key Rotation Cadence</dt>
            <dd className="font-semibold text-foreground">Every 30 Days (Automated)</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Next Scheduled Rotation</dt>
            <dd className="font-semibold text-mint">Nov 27, 2024</dd>
          </div>
        </dl>
      </div>
      <button type="button" onClick={onAttest} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground/[0.06] px-4 py-2.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.1]">
        <BadgeCheckIcon className="size-4" />
        Download Enclave Audit Attestation
      </button>
    </section>
  )
}
