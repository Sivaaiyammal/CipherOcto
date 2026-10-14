import * as React from "react"
import { ChevronRightIcon, GitCompareIcon, PlusCircleIcon, SlidersHorizontalIcon } from "lucide-react"

import { AuditPanel, TripwirePanel } from "@/components/releases/bottom-panels"
import { ReleaseKpis } from "@/components/releases/release-kpis"
import { BuildSheet, CompareSheet, CreateReleaseSheet, HaltSheet, RulesSheet } from "@/components/releases/release-sheets"
import { ReleaseTable } from "@/components/releases/release-table"
import { Spotlight } from "@/components/releases/spotlight"
import { SEED_EVENTS, SEED_RELEASES, SEED_RULES, SPOTLIGHT_ID, STAGES, initial, type Release, type ReleaseEvent, type Tone, type TripRule } from "@/data/releases"
import { downloadFile, toCsv } from "@/lib/download"

const TONES: Tone[] = ["mint", "lavender", "blue", "amber", "pink"]
const headerBtn =
  "flex h-10 items-center gap-1.5 rounded-lg bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"

export default function ReleasesPage() {
  const [releases, setReleases] = React.useState<Release[]>(SEED_RELEASES)
  const [stage, setStage] = React.useState(1)
  const [rules, setRules] = React.useState<TripRule[]>(SEED_RULES)
  const [events, setEvents] = React.useState<ReleaseEvent[]>(SEED_EVENTS)
  const [rollbacks, setRollbacks] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const [rulesKey, setRulesKey] = React.useState(0)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [haltOpen, setHaltOpen] = React.useState(false)
  const [build, setBuild] = React.useState<{ release: Release | null; mode: "inspect" | "logs"; open: boolean }>({ release: null, mode: "inspect", open: false })

  const spotlight = releases.find((r) => r.id === SPOTLIGHT_ID)!

  const patch = (id: string, p: Partial<Release>) => setReleases((list) => list.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const log = (title: string, body: string, tone = "bg-mint") =>
    setEvents((list) => [{ id: `ev-${Date.now().toString(36)}-${list.length}`, title, body, when: "just now", tone, ts: Date.now() }, ...list])

  const promoteSpotlight = () => {
    const next = STAGES[stage + 1]
    if (!next) return
    setStage(stage + 1)
    if (next.pct === 100) {
      patch(spotlight.id, { pct: 100, status: "shipped" })
      log(`Rollout Completed: ${spotlight.version}`, `${spotlight.app} ${spotlight.version} reached 100% full release across all geo-targets.`, "bg-neutral-deep")
    } else {
      patch(spotlight.id, { pct: next.pct })
      log(`Promoted ${spotlight.app} to ${next.pct}%`, `Promoted from ${spotlight.pct}% to ${next.pct}% by Elena Rostova (Verified via Hardware 2FA).`)
    }
  }

  const advanceRow = (r: Release) => {
    if (r.id === SPOTLIGHT_ID) return promoteSpotlight()
    if (r.status === "review") {
      patch(r.id, { status: "canary", pct: 1, track: r.track.replace("Connect", "Phased") })
      log(`${r.app} ${r.version} approved`, "Store review passed — canary rollout started at 1%.")
      return
    }
    const next = STAGES.find((s) => s.pct > r.pct)
    if (!next) return
    patch(r.id, { pct: next.pct, status: next.pct === 100 ? "shipped" : r.status })
    log(`Promoted ${r.app} to ${next.pct}%`, `Promoted from ${r.pct}% to ${next.pct}% by Elena Rostova (Verified via Hardware 2FA).`)
  }

  const exportAudit = () =>
    downloadFile("release-audit.csv", toCsv([["When", "Event", "Detail"], ...events.map((e) => [e.when, e.title, e.body])]))

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Platform</span>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-semibold text-foreground">Releases &amp; Deployments</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Release Management &amp; Rollout Control</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-mint-border px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-mint uppercase">
              <span className="size-1.5 rounded-full bg-stream-mrr motion-safe:animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Orchestrate phased App Store &amp; Google Play rollouts, canary builds, crash regression tripwires, and store review submissions
            across all apps in your ecosystem.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCompareOpen(true)} className={headerBtn}>
            <GitCompareIcon className="size-4" />
            Compare Builds
          </button>
          <button
            type="button"
            onClick={() => {
              setRulesKey((k) => k + 1)
              setRulesOpen(true)
            }}
            className={headerBtn}
          >
            <SlidersHorizontalIcon className="size-4" />
            Rollout Rules
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-1)] hover:bg-primary/90"
          >
            <PlusCircleIcon className="size-4" />
            Create New Release
          </button>
        </div>
      </section>

      <ReleaseKpis releases={releases} rules={rules} rollbacks={rollbacks} />

      <Spotlight
        release={spotlight}
        stage={stage}
        onPause={() => {
          patch(spotlight.id, { status: "paused" })
          log(`Paused ${spotlight.app} rollout`, `Held at ${spotlight.pct}% by Elena Rostova. Existing installs unaffected.`, "bg-amber")
        }}
        onResume={() => {
          patch(spotlight.id, { status: "rollout" })
          log(`Resumed ${spotlight.app} rollout`, `Phased delivery continues from ${spotlight.pct}%.`)
        }}
        onHalt={() => setHaltOpen(true)}
        onPromote={promoteSpotlight}
      />

      <ReleaseTable
        releases={releases}
        onInspect={(r) => setBuild({ release: r, mode: "inspect", open: true })}
        onLogs={(r) => setBuild({ release: r, mode: "logs", open: true })}
        onAdvance={advanceRow}
        onSubmit={(r) => {
          patch(r.id, { status: "review", note: "Submitted for expedited review", crash: "Pre-flight Passed" })
          log(`Submitted ${r.app} ${r.version}`, "Binary uploaded and sent to store review by Elena Rostova.", "bg-tertiary")
        }}
      />

      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <TripwirePanel
          rules={rules}
          onEdit={() => {
            setRulesKey((k) => k + 1)
            setRulesOpen(true)
          }}
        />
        <AuditPanel events={events} onExport={exportAudit} />
      </div>

      <CreateReleaseSheet
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        apps={[...new Set(releases.map((r) => r.app))]}
        existing={releases}
        onCreate={(v) => {
          const id = `r-${Date.now().toString(36)}`
          setReleases((list) => [
            {
              id,
              app: v.app,
              initials: initial(v.app),
              tone: TONES[v.app.length % TONES.length],
              version: v.version,
              build: v.build,
              commit: Math.random().toString(16).slice(2, 8),
              track: v.track,
              platform: v.track.startsWith("Play") ? "android" : v.track.startsWith("Internal") ? "sdk" : "ios",
              status: "draft",
              pct: 0,
              audience: 100_000,
              crash: "CI queued",
              note: "Awaiting first build checks",
              highlights: v.highlights.length ? v.highlights : ["No highlights yet"],
            },
            ...list,
          ])
          log(`Draft created: ${v.app} ${v.version}`, `Build ${v.build} registered on ${v.track}.`, "bg-mint-border")
        }}
      />
      <CompareSheet key={`cmp-${compareOpen}`} open={compareOpen} onOpenChange={setCompareOpen} releases={releases} />
      <RulesSheet
        key={`rules-${rulesKey}`}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        rules={rules}
        onSave={(next) => {
          setRules(next)
          log("Tripwire rules updated", `${next.filter((r) => r.enabled).length} of ${next.length} circuit breakers armed.`, "bg-neutral-deep")
        }}
      />
      <BuildSheet open={build.open} onOpenChange={(open) => setBuild((b) => ({ ...b, open }))} release={build.release} mode={build.mode} />
      <HaltSheet
        open={haltOpen}
        onOpenChange={setHaltOpen}
        release={spotlight}
        onConfirm={() => {
          patch(spotlight.id, { status: "halted" })
          setRollbacks((n) => n + 1)
          log(`Emergency halt: ${spotlight.app} ${spotlight.version}`, "Phased delivery frozen on both stores; fallback v2.8.4 queued.", "bg-destructive")
        }}
      />
    </>
  )
}
