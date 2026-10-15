import * as React from "react"
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  CircleCheckIcon,
  CircleIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  EyeIcon,
  InfoIcon,
  Loader2Icon,
  PlayIcon,
  RocketIcon,
  ShieldAlertIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  LifeBuoyIcon,
} from "lucide-react"

import { Pill } from "@/components/register/fields"
import { APP_TONE_TILE } from "@/data/apps"
import { CATEGORIES, platformSummary, validateStep, type RegisterDraft } from "@/data/register"
import { cn } from "@/lib/utils"

function AppIconTile({ draft, className }: { draft: RegisterDraft; className?: string }) {
  const category = CATEGORIES.find((c) => c.value === draft.category) ?? CATEGORIES[0]
  const Icon = category.icon
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        !draft.iconDataUrl && APP_TONE_TILE[category.tone],
        className
      )}
    >
      {draft.iconDataUrl ? <img src={draft.iconDataUrl} alt="" className="size-full object-cover" /> : <Icon />}
    </span>
  )
}

export function SetupChecklist({ draft, registered }: { draft: RegisterDraft; registered: number }) {
  const items = [
    { label: "Workspace Registry Ready", detail: `${registered} app${registered === 1 ? "" : "s"} registered in this workspace`, done: true },
    { label: "Valid Identifiers Defined", detail: `${platformSummary(draft)} packaging validated`, pending: "Bundle ID / package name in Step 01", done: Object.keys(validateStep(0, draft)).length === 0 },
    {
      label: "Store API Credentials Linked",
      detail: "Credentials attached for verification",
      pending: "Optional — verified once the store is connected",
      done:
        Object.keys(validateStep(1, draft)).length === 0 &&
        (!draft.ios.enabled || !!draft.ios.p8FileName) &&
        (!draft.android.enabled || !!draft.android.serviceAccountEmail),
    },
    { label: "RTDN & Webhooks Routed", detail: "Notification endpoints configured", pending: "Configured in Step 03", done: Object.keys(validateStep(2, draft)).length === 0 && (!draft.android.enabled || !!draft.android.topic) },
  ]
  const done = items.filter((i) => i.done).length

  return (
    <section className="space-y-4 rounded-2xl bg-mint-surface p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-mint-hover text-mint">
            <ClipboardCheckIcon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-lg leading-[26px] font-semibold text-foreground">Setup Checklist</h3>
            <span className="text-xs font-medium text-mint">Real-Time Validation</span>
          </div>
        </div>
        <span className="rounded-full bg-card px-2 py-1 text-[11px] font-bold text-mint tabular-nums">
          {done} / {items.length} Done
        </span>
      </header>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2.5">
            {i.done ? (
              <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-mint" />
            ) : (
              <CircleIcon className="mt-0.5 size-4 shrink-0 text-subtle-foreground" />
            )}
            <div>
              <span className={cn("block text-[13px] text-foreground", i.done ? "font-semibold" : "font-medium")}>{i.label}</span>
              <span className="text-xs text-muted-foreground">{i.done ? i.detail : (i.pending ?? i.detail)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CatalogPreview({ draft, ready }: { draft: RegisterDraft; ready: boolean }) {
  return (
    <section className="space-y-4 rounded-2xl bg-blue-surface p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <EyeIcon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-lg leading-[26px] font-semibold text-foreground">Catalog Preview</h3>
            <span className="text-xs text-muted-foreground">Live Dashboard Rendering</span>
          </div>
        </div>
        <InfoIcon className="size-4 text-muted-foreground" aria-label="Updates as you type" />
      </header>

      <div className="space-y-2 rounded-xl bg-card p-4 shadow-[var(--shadow-2)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <AppIconTile draft={draft} className="size-12 rounded-xl [&>svg]:size-6" />
            <div className="min-w-0">
              <h4 className="truncate text-[13px] font-bold text-foreground">{draft.name.trim() || "Untitled Application"}</h4>
              <span className="text-xs text-muted-foreground">
                {draft.category} • {platformSummary(draft)}
              </span>
            </div>
          </div>
          <Pill tone={ready ? "mint" : "muted"}>{ready ? "Ready to link" : "Draft"}</Pill>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-background px-2 py-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUpIcon className="size-3.5 text-mint" />
            Telemetry: <strong className="text-foreground">Standby</strong>
          </span>
          <span className="font-mono text-[11px]">RTDN v2</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="max-w-[170px] truncate font-mono text-[11px]">
            {(draft.ios.enabled ? draft.ios.bundleId : draft.android.packageName) || "com.example.app"}
          </span>
          <span className="flex items-center gap-1">
            {draft.ios.enabled && <SmartphoneIcon className="size-3.5" aria-label="App Store" />}
            {draft.android.enabled && <PlayIcon className="size-3.5" aria-label="Google Play" />}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        This card is added to your workspace when you activate the app in Step 04.
      </p>
    </section>
  )
}

const TIPS: Record<number, { title: string; body: React.ReactNode }> = {
  0: {
    title: "Identifiers can't change later",
    body: (
      <>
        Bundle IDs and package names are permanent in both stores. Use the exact values from Xcode and{" "}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">build.gradle</code> — CipherOcto matches purchases
        by them.
      </>
    ),
  },
  1: {
    title: "StoreKit 2 & Play API Quick Tip",
    body: (
      <>
        Your App Store Connect key needs the <strong>Finance</strong> and <strong>App Manager</strong> roles. The Google service account needs{" "}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">View financial data</code> access in Play Console.
      </>
    ),
  },
  2: {
    title: "RTDN Quick Tip",
    body: (
      <>
        Grant <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">Pub/Sub Publisher</code> on your topic to
        Google Play's notification service account, then send a test notification from Play Console to confirm delivery.
      </>
    ),
  },
}

export function StepTip({ step }: { step: number }) {
  const tip = TIPS[step]
  if (!tip) return null
  return (
    <section className="space-y-2 rounded-2xl bg-neutral-strong/60 p-6 shadow-[var(--shadow-1)]">
      <h4 className="flex items-center gap-2 text-[13px] font-bold text-foreground">
        <LifeBuoyIcon className="size-5" />
        {tip.title}
      </h4>
      <p className="text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
      <a href="#" className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold tracking-[0.04em] text-foreground hover:underline">
        View Step-by-Step Setup Guide
        <ArrowUpRightIcon className="size-3" />
      </a>
    </section>
  )
}

// ── Step 4 column ──────────────────────────────────────────────────────────

export function ActivationCard({
  draft,
  usedSlots,
  ready,
  activating,
  onActivate,
  onDownloadReport,
}: {
  draft: RegisterDraft
  usedSlots: number
  ready: boolean
  activating: boolean
  onActivate: () => void
  onDownloadReport: () => void
}) {
  const after = usedSlots + 1
  return (
    <section className="space-y-4 rounded-2xl bg-mint-surface p-6 shadow-[var(--shadow-1)]">
      <div className="flex items-center gap-4">
        <AppIconTile draft={draft} className="size-14 rounded-2xl shadow-[var(--shadow-2)] [&>svg]:size-7" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-lg leading-[26px] font-bold text-foreground">{draft.name.trim() || "Untitled Application"}</h3>
            {ready && <BadgeCheckIcon className="size-4 shrink-0 text-mint" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{draft.category}</p>
          <span className="mt-0.5 inline-block rounded bg-neutral-strong px-1 py-0.5 font-mono text-[10px] font-semibold text-foreground">Not released yet</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-card p-2.5 shadow-[var(--shadow-1)]">
          <div>
            <span className="block text-xs text-muted-foreground">Target Deployment</span>
            <span className="text-[13px] font-bold text-foreground">{draft.env.production ? "Production Live" : "Sandbox Only"}</span>
          </div>
          <Pill tone={draft.env.production ? "mint" : "muted"}>{draft.env.production ? "LIVE" : "SANDBOX"}</Pill>
        </div>
        <div className="space-y-1 rounded-xl bg-card p-2.5 shadow-[var(--shadow-1)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Workspace Apps</span>
            <span className="text-[11px] font-bold text-foreground tabular-nums">
              {usedSlots} → {after} (+1)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-strong">
            <div className="h-full rounded-full bg-stream-mrr transition-[width] duration-500" style={{ width: `${(usedSlots / after) * 100}%` }} />
          </div>
          <span className="block text-[11px] text-muted-foreground">
            This will be app #{after} in your CipherOcto workspace.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled={!ready || activating}
          onClick={onActivate}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-[var(--shadow-2)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {activating ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <RocketIcon className="size-5 text-mint-border transition-transform group-hover:scale-110" />
          )}
          {activating ? "Deploying Production Credentials…" : ready ? "Activate App in Production" : "Waiting for verification…"}
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={onDownloadReport}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-card text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04] disabled:opacity-50"
        >
          <DownloadIcon className="size-4" />
          Download Verification Report
        </button>
      </div>
    </section>
  )
}

export function PreFlightChecklist({ draft, ready }: { draft: RegisterDraft; ready: boolean }) {
  const items = [
    { label: "Application Metadata & Assets", detail: draft.iconDataUrl ? "Custom icon uploaded, category mapped" : "Category icon used — upload one anytime" },
    ...(draft.ios.enabled ? [{ label: "StoreKit 2 In-App API Key", detail: `${draft.ios.p8FileName ?? ".p8"} attached` }] : []),
    ...(draft.android.enabled ? [{ label: "Google Play Service JSON", detail: "Attached — verified once Google Play is connected" }] : []),
    ...(draft.android.enabled ? [{ label: "RTDN Pub/Sub Topic Push", detail: "Saved — verified once Google Play is connected" }] : []),
    ...(draft.webhook.url ? [{ label: "HMAC-SHA256 Webhook Ping", detail: "Saved — test delivery runs once connected" }] : []),
  ]
  return (
    <section className="space-y-4 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-foreground">Pre-Flight Checklist</h4>
        <span className="text-[11px] font-bold text-mint tabular-nums">
          {ready ? items.length : 0} of {items.length} Ready
        </span>
      </header>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2 rounded-lg p-1 hover:bg-background">
            {ready ? <CircleCheckIcon className="mt-0.5 size-[18px] shrink-0 text-mint" /> : <Loader2Icon className="mt-0.5 size-[18px] shrink-0 animate-spin text-subtle-foreground" />}
            <div>
              <span className="block text-[13px] font-semibold text-foreground">{i.label}</span>
              <span className="text-xs text-muted-foreground">{i.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CircuitBreakerCard({ enabled }: { enabled: boolean }) {
  return (
    <section className="space-y-2 rounded-2xl bg-background p-4 shadow-[var(--shadow-1)] ring-1 ring-border/60">
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
        <ShieldAlertIcon className="size-4" />
        Automated Circuit Breaker
        <Pill tone={enabled ? "mint" : "muted"} className="ml-auto">{enabled ? "ON" : "OFF"}</Pill>
      </span>
      <p className="text-xs text-muted-foreground">
        {enabled ? (
          <>
            Rollout auto-pauses if the webhook failure rate exceeds <strong>0.25%</strong> in any rolling 5-minute window.
          </>
        ) : (
          "Disabled in Step 01 — releases will not auto-pause on failures."
        )}
      </p>
      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <span>Slack Escalation</span>
        <span className="font-semibold text-foreground">Not configured</span>
      </div>
    </section>
  )
}
