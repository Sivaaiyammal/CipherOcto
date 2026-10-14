import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { Field, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { FALLBACK, LOG_LINES, type Release, type TripRule } from "@/data/releases"
import { cn } from "@/lib/utils"

const VERSION_RE = /^v\d+\.\d+\.\d+(-[a-z0-9.]+)?$/i

// ── Create release ─────────────────────────────────────────────────────────

const TRACKS = [
  { value: "App Store Connect", label: "App Store Connect (iOS)" },
  { value: "Play Console", label: "Google Play Console (Android)" },
  { value: "Internal Maven / CocoaPods", label: "Internal SDK registry" },
]

export function CreateReleaseSheet({
  open,
  onOpenChange,
  apps,
  existing,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  apps: string[]
  existing: Release[]
  onCreate: (v: { app: string; version: string; build: number; track: string; highlights: string[] }) => void
}) {
  const [app, setApp] = React.useState(apps[0] ?? "")
  const [version, setVersion] = React.useState("")
  const [build, setBuild] = React.useState("")
  const [track, setTrack] = React.useState(TRACKS[0].value)
  const [notes, setNotes] = React.useState("")
  const [attempted, setAttempted] = React.useState(false)

  const v = version.trim().startsWith("v") ? version.trim() : `v${version.trim()}`
  const errors: Record<string, string> = {}
  if (!VERSION_RE.test(v)) errors.version = "Use semantic versioning, e.g. v2.9.1."
  else if (existing.some((r) => r.app === app && r.version === v)) errors.version = `${app} ${v} already exists.`
  if (!/^[1-9]\d{0,5}$/.test(build.trim())) errors.build = "Enter a build number above zero."
  const shown = attempted ? errors : {}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Create New Release</SheetTitle>
          <SheetDescription>Starts as a draft. Nothing is submitted to a store until you promote it.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="rel-app" label="App" required>
            <SelectInput id="rel-app" value={app} onChange={(e) => setApp(e.target.value)} options={apps.map((a) => ({ value: a, label: a }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="rel-version" label="Version" required error={shown.version}>
              <TextInput id="rel-version" mono value={version} placeholder="v2.9.1" onChange={(e) => setVersion(e.target.value)} error={shown.version} />
            </Field>
            <Field id="rel-build" label="Build number" required error={shown.build}>
              <TextInput id="rel-build" mono inputMode="numeric" value={build} placeholder="149" onChange={(e) => setBuild(e.target.value)} error={shown.build} />
            </Field>
          </div>
          <Field id="rel-track" label="Distribution track">
            <SelectInput id="rel-track" value={track} onChange={(e) => setTrack(e.target.value)} options={TRACKS} />
          </Field>
          <Field id="rel-notes" label="Release highlights" hint="Comma-separated, shown as chips in the table.">
            <TextInput id="rel-notes" value={notes} placeholder="Paywall v5, Widget fixes" onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setAttempted(true)
              if (Object.keys(errors).length) return
              onCreate({ app, version: v, build: Number(build), track, highlights: notes.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3) })
              onOpenChange(false)
            }}
          >
            Create draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Compare builds ─────────────────────────────────────────────────────────

export function CompareSheet({ open, onOpenChange, releases }: { open: boolean; onOpenChange: (open: boolean) => void; releases: Release[] }) {
  const options = releases.map((r) => ({ value: r.id, label: `${r.app} ${r.version} (${r.build})` }))
  const [a, setA] = React.useState(releases[0]?.id ?? "")
  const [b, setB] = React.useState(releases[4]?.id ?? releases[1]?.id ?? "")
  const ra = releases.find((r) => r.id === a)
  const rb = releases.find((r) => r.id === b)

  const rows: [string, string, string][] =
    ra && rb
      ? [
          ["Version", ra.version, rb.version],
          ["Build", String(ra.build), String(rb.build)],
          ["Commit", `#${ra.commit}`, `#${rb.commit}`],
          ["Track", ra.track, rb.track],
          ["Health", ra.crash, rb.crash],
          ["Rollout", `${ra.pct}%`, `${rb.pct}%`],
        ]
      : []
  const onlyA = ra && rb ? ra.highlights.filter((h) => !rb.highlights.includes(h)) : []
  const onlyB = ra && rb ? rb.highlights.filter((h) => !ra.highlights.includes(h)) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Compare Builds</SheetTitle>
          <SheetDescription>Side-by-side metadata, health and highlights for any two builds.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="cmp-a" label="Build A">
              <SelectInput id="cmp-a" value={a} onChange={(e) => setA(e.target.value)} options={options} />
            </Field>
            <Field id="cmp-b" label="Build B">
              <SelectInput id="cmp-b" value={b} onChange={(e) => setB(e.target.value)} options={options} />
            </Field>
          </div>
          <table className="w-full border-collapse text-left text-[13px]">
            <tbody className="divide-y divide-border/60">
              {rows.map(([label, va, vb]) => (
                <tr key={label}>
                  <th scope="row" className="py-2.5 pr-3 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">{label}</th>
                  <td className={cn("py-2.5 pr-3", va !== vb && "font-semibold text-foreground")}>{va}</td>
                  <td className={cn("py-2.5", va !== vb && "font-semibold text-foreground")}>{vb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-background p-3">
              <p className="mb-1.5 font-bold text-muted-foreground uppercase">Only in A</p>
              {onlyA.length ? onlyA.map((h) => <p key={h} className="text-foreground">+ {h}</p>) : <p className="text-muted-foreground">Nothing unique</p>}
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="mb-1.5 font-bold text-muted-foreground uppercase">Only in B</p>
              {onlyB.length ? onlyB.map((h) => <p key={h} className="text-foreground">+ {h}</p>) : <p className="text-muted-foreground">Nothing unique</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Rollout rules ──────────────────────────────────────────────────────────

export function RulesSheet({
  open,
  onOpenChange,
  rules,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rules: TripRule[]
  onSave: (rules: TripRule[]) => void
}) {
  const [draft, setDraft] = React.useState(rules)
  const patch = (id: string, p: Partial<TripRule>) => setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const invalid = draft.some((r) => r.value != null && !(r.value > 0))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Rollout Rules</SheetTitle>
          <SheetDescription>Circuit breakers freeze promotion automatically when a threshold is breached.</SheetDescription>
        </SheetHeader>
        <ul className="flex-1 space-y-3 overflow-y-auto p-4">
          {draft.map((r) => (
            <li key={r.id} className="rounded-xl bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.detail(r.value)}</p>
                </div>
                <Switch checked={r.enabled} onCheckedChange={(c) => patch(r.id, { enabled: c })} aria-label={`${r.title} armed`} />
              </div>
              {r.value != null && (
                <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  Threshold
                  <input
                    type="number"
                    min={0}
                    step={r.step}
                    value={r.value}
                    onChange={(e) => patch(r.id, { value: Number(e.target.value) })}
                    className="h-8 w-24 rounded-lg bg-card px-2 text-[13px] font-semibold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  {r.unit}
                </label>
              )}
            </li>
          ))}
        </ul>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalid}
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            Save rules
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Inspect build / logs ───────────────────────────────────────────────────

export function BuildSheet({ open, onOpenChange, release, mode }: { open: boolean; onOpenChange: (open: boolean) => void; release: Release | null; mode: "inspect" | "logs" }) {
  if (!release) return null
  const facts: [string, string][] = [
    ["Version", `${release.version} (build ${release.build})`],
    ["Commit", `#${release.commit}`],
    ["Track", release.track],
    ["Rollout", release.status === "draft" ? "Not started" : `${release.pct}%`],
    ["Health", release.crash],
    ["Note", release.note],
  ]
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>
            {mode === "inspect" ? "Inspect build" : "Build logs"} — {release.app} {release.version}
          </SheetTitle>
          <SheetDescription>{mode === "inspect" ? "Signing, store track and health snapshot." : "Most recent pipeline output."}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "inspect" ? (
            <dl className="space-y-1 text-[13px]">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 rounded-lg bg-background p-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold text-foreground">{v}</dd>
                </div>
              ))}
              <div className="rounded-lg bg-background p-2.5">
                <dt className="mb-1.5 text-muted-foreground">Highlights</dt>
                <dd className="flex flex-wrap gap-1">
                  {release.highlights.map((h) => (
                    <span key={h} className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium shadow-[var(--shadow-1)]">{h}</span>
                  ))}
                </dd>
              </div>
            </dl>
          ) : (
            <pre className="overflow-x-auto rounded-xl bg-primary p-4 font-mono text-xs leading-6 text-primary-foreground">{LOG_LINES(release).join("\n")}</pre>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Halt & rollback ────────────────────────────────────────────────────────

export function HaltSheet({ open, onOpenChange, release, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; release: Release; onConfirm: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-pink-hover text-destructive">
              <TriangleAlertIcon className="size-5" />
            </span>
            Initiate Emergency Rollout Halt?
          </SheetTitle>
          <SheetDescription>
            This immediately pauses phased delivery on App Store Connect and Google Play Console for{" "}
            <strong className="text-foreground">
              {release.app} {release.version}
            </strong>
            . Existing {Math.round((release.audience * release.pct) / 100).toLocaleString("en-US")} active installs stay on {release.version} unless a downgrade manifest is submitted.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-2 p-4">
          <p className="text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">Required fallback version</p>
          <p className="rounded-xl bg-background p-3 font-mono text-[13px] text-foreground">{FALLBACK}</p>
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel &amp; Keep Rolling
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Confirm Emergency Halt
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
