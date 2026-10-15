import { CheckIcon, FastForwardIcon, PauseCircleIcon, PlayCircleIcon, SirenIcon, TargetIcon, HeartPulseIcon, TimerIcon, CpuIcon, SmartphoneIcon } from "lucide-react"

import { STAGES, type Release } from "@/data/releases"
import { cn } from "@/lib/utils"

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

export function Spotlight({
  release,
  stage,
  onPause,
  onResume,
  onHalt,
  onPromote,
  readOnly = false,
}: {
  readOnly?: boolean
  release: Release
  stage: number
  onPause: () => void
  onResume: () => void
  onHalt: () => void
  onPromote: () => void
}) {
  const halted = release.status === "halted"
  const paused = release.status === "paused"
  const done = release.status === "shipped"
  const next = STAGES[stage + 1]
  const devices = Math.round((release.audience * release.pct) / 100)
  const fillPct = (stage / (STAGES.length - 1)) * 100

  return (
    <section className="relative mx-4 overflow-hidden rounded-2xl bg-card p-6 shadow-[var(--shadow-1)] lg:mx-6 lg:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-mint-border via-mint to-primary" />

      <div className="flex flex-col justify-between gap-4 @5xl/main:flex-row @5xl/main:items-center">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-mint-surface text-mint">
            <TargetIcon className="size-7" />
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase",
                  halted ? "bg-pink-hover text-destructive" : paused ? "bg-amber-hover text-amber" : done ? "bg-neutral-strong text-muted-foreground" : "bg-mint-border text-mint"
                )}
              >
                {halted ? "Rollout Halted" : paused ? "Rollout Paused" : done ? "Fully Released" : "Production Staged Rollout"}
              </span>
              <span className="rounded-full bg-neutral-strong px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">Day {stage + 1} of 7 Phased Plan</span>
              <span className="text-xs text-muted-foreground">Started Oct 28, 2024 at 14:00 UTC</span>
            </div>
            <h2 className="text-[22px] leading-[30px] font-bold tracking-[-0.015em] text-foreground">
              Spotlight: {release.app} {release.version} (Build {release.build})
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Targeted across 14 markets with new dynamic paywall experiment and CoreSDK 4.1 engine upgrade.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {paused ? (
            <button type="button" disabled={readOnly} onClick={onResume} className="disabled:opacity-50 flex h-10 items-center gap-1.5 rounded-lg bg-foreground/[0.05] px-3.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.09]">
              <PlayCircleIcon className="size-4" />
              Resume Rollout
            </button>
          ) : (
            <button
              type="button"
              disabled={halted || done || readOnly}
              onClick={onPause}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-foreground/[0.05] px-3.5 text-[13px] font-semibold text-foreground hover:bg-foreground/[0.09] disabled:opacity-50"
            >
              <PauseCircleIcon className="size-4" />
              Pause Rollout
            </button>
          )}
          <button
            type="button"
            disabled={halted || done || readOnly}
            onClick={onHalt}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-pink-hover px-3.5 text-[13px] font-semibold text-destructive hover:bg-pink-border disabled:opacity-50"
          >
            <SirenIcon className="size-4" />
            Halt &amp; Rollback
          </button>
          <button
            type="button"
            disabled={halted || paused || done || !next || readOnly}
            onClick={onPromote}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90 disabled:opacity-50"
          >
            <FastForwardIcon className="size-4" />
            {next ? `Promote to ${next.label === "Full Prod" ? "Full Production" : next.label} (${next.pct}%)` : "Fully Released"}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-foreground">Phased Rollout Velocity Timeline</span>
          <span className={cn("font-bold", halted ? "text-destructive" : "text-mint")}>
            Current Target: {release.pct}% Production Base (~{devices.toLocaleString("en-US")} devices)
          </span>
        </p>

        <div className="overflow-x-auto pb-1">
          <div className="relative min-w-[600px] px-12 pt-3 pb-14">
            <div className="h-2 w-full rounded-full bg-foreground/[0.07]" />
            <div className={cn("absolute top-3 left-12 h-2 rounded-full transition-[width] duration-500", halted ? "bg-destructive" : "bg-mint")} style={{ width: `calc((100% - 6rem) * ${fillPct / 100})` }} />
            <ol className="absolute inset-x-12 top-0 flex justify-between">
              {STAGES.map((s, i) => {
                const reached = i < stage || (done && i <= stage)
                const active = i === stage && !done
                return (
                  <li key={s.label} className="flex w-0 flex-col items-center">
                    <span
                      className={cn(
                        "mt-[3px] flex items-center justify-center rounded-full ring-4 ring-card",
                        reached ? "size-5 bg-mint text-white" : active ? (halted ? "size-6 bg-pink-hover ring-pink-border" : "size-6 bg-mint-border ring-mint-border") : "size-4 bg-neutral-deep"
                      )}
                    >
                      {reached && <CheckIcon className="size-3" />}
                      {active && <span className={cn("size-2.5 rounded-full", halted ? "bg-destructive" : "bg-mint motion-safe:animate-pulse")} />}
                    </span>
                    <span className={cn("mt-2 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap", active ? (halted ? "text-destructive" : "text-mint") : reached ? "text-foreground" : "text-muted-foreground")}>
                      {s.label}
                      {active && !halted ? " (Active)" : ""}
                    </span>
                    <span className={cn("text-[11px] whitespace-nowrap", active ? "font-semibold text-mint" : "text-muted-foreground")}>
                      {s.pct}%{reached ? " (Completed)" : active ? (halted ? " Halted" : paused ? " Paused" : " Deploying") : s.label === "Full Prod" ? " Release" : ""}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 @3xl/main:grid-cols-4">
        {[
          { icon: SmartphoneIcon, label: "Active Deployments", value: devices.toLocaleString("en-US"), note: `+${compact(Math.round(devices * 0.23))} since 09:00` },
          { icon: HeartPulseIcon, label: "Crash-free Sessions", value: "99.982%", note: "Threshold: > 99.85%" },
          { icon: TimerIcon, label: "ANR / Freeze Rate", value: "0.004%", note: "Below Android Vitals limit" },
          { icon: CpuIcon, label: "Memory Tripwires", value: "0 Anomalies", note: "OOM delta: 0.00%" },
        ].map((t) => (
          <div key={t.label} className="flex flex-col justify-center rounded-xl bg-background p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <t.icon className="size-3.5 text-mint" />
              {t.label}
            </p>
            <p className="mt-1 text-lg font-bold text-foreground tabular-nums">{t.value}</p>
            <p className="text-[11px] font-bold tracking-[0.04em] text-mint">{t.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
