import * as React from "react"

import type { RegisterDraft } from "@/data/register"

// "pass" means every check CipherOcto can really run today passed. Checks that need a
// live store connection are listed but never reported as passed (see REMOTE_PENDING).
export type ProbeStatus = "idle" | "running" | "pass" | "fail"
export type Target = "apple" | "google" | "webhook"
type LogLine = { time: string; tag: string; text: string; strong?: boolean }

const REMOTE_NOTE = "available once Google Play is connected"

/** Rows shown in each probe card. The last row of each group needs a store connection. */
export const CHECKS: Record<Target, string[]> = {
  apple: ["Bundle ID format is valid", "Bundle ID is not already registered", `App Store Connect link — ${"available once App Store is connected"}`],
  google: ["Package name format is valid", "Package name is not already registered", `Play credentials & RTDN — ${REMOTE_NOTE}`],
  webhook: ["Endpoint is a valid HTTPS URL", `Signed test delivery — ${REMOTE_NOTE}`],
}

/** Number of leading rows in CHECKS[target] that can be run locally. */
const LOCAL_COUNT: Record<Target, number> = { apple: 2, google: 2, webhook: 1 }

const BUNDLE_RE = /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)+$/
const PACKAGE_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/

const stamp = () => {
  const d = new Date()
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`
}

type Result = { ok: boolean; tag: string; text: string }

function localResults(t: Target, draft: RegisterDraft, taken: Set<string>): Result[] {
  if (t === "google") {
    const pkg = draft.android.packageName.trim()
    return [
      { ok: PACKAGE_RE.test(pkg), tag: "FORMAT", text: PACKAGE_RE.test(pkg) ? `${pkg} is a valid package name` : `"${pkg}" is not a valid package name` },
      { ok: !taken.has(pkg.toLowerCase()), tag: "UNIQUE", text: taken.has(pkg.toLowerCase()) ? `${pkg} is already registered` : `${pkg} is not registered yet` },
    ]
  }
  if (t === "apple") {
    const id = draft.ios.bundleId.trim()
    return [
      { ok: BUNDLE_RE.test(id), tag: "FORMAT", text: BUNDLE_RE.test(id) ? `${id} is a valid bundle ID` : `"${id}" is not a valid bundle ID` },
      { ok: !taken.has(id.toLowerCase()), tag: "UNIQUE", text: taken.has(id.toLowerCase()) ? `${id} is already registered` : `${id} is not registered yet` },
    ]
  }
  let valid = false
  try {
    valid = new URL(draft.webhook.url).protocol === "https:"
  } catch {
    valid = false
  }
  return [{ ok: valid, tag: "URL", text: valid ? `${draft.webhook.url} is a valid HTTPS endpoint` : "Webhook URL must be a full https:// URL" }]
}

/**
 * Registration checks that run in the browser against what CipherOcto already knows:
 * identifier format and uniqueness against the registered apps. Anything that needs
 * a store connection (credentials, Pub/Sub, signed delivery) is shown as pending —
 * it is never reported as passed, and never blocks registration.
 */
export function useVerification(draft: RegisterDraft, registeredIds: string[] = []) {
  const targets = React.useMemo<Target[]>(
    () => [
      ...(draft.ios.enabled ? (["apple"] as const) : []),
      ...(draft.android.enabled ? (["google"] as const) : []),
      ...(draft.webhook.url ? (["webhook"] as const) : []),
    ],
    [draft.ios.enabled, draft.android.enabled, draft.webhook.url]
  )
  const [progress, setProgress] = React.useState<Record<Target, number>>({ apple: 0, google: 0, webhook: 0 })
  const [status, setStatus] = React.useState<Record<Target, ProbeStatus>>({ apple: "idle", google: "idle", webhook: "idle" })
  const [latency] = React.useState<Record<Target, number>>({ apple: 0, google: 0, webhook: 0 })
  const [log, setLog] = React.useState<LogLine[]>([])
  const timers = React.useRef<number[]>([])

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const run = (only?: Target) => {
    const taken = new Set(registeredIds.map((id) => id.toLowerCase()))
    const list = only ? [only] : targets
    if (!only) setLog([{ time: stamp(), tag: "INIT", text: `Checking ${draft.name || "new app"} against your workspace`, strong: true }])

    let delay = 150
    list.forEach((t) => {
      const results = localResults(t, draft, taken)
      setStatus((s) => ({ ...s, [t]: "running" }))
      setProgress((p) => ({ ...p, [t]: 0 }))
      let failed = false
      results.forEach((r, i) => {
        delay += 280
        timers.current.push(
          window.setTimeout(() => {
            setLog((l) => [...l, { time: stamp(), tag: r.tag, text: r.text }])
            if (!r.ok) failed = true
            if (r.ok && !failed) setProgress((p) => ({ ...p, [t]: i + 1 }))
            if (i === LOCAL_COUNT[t] - 1) {
              setStatus((s) => ({ ...s, [t]: failed ? "fail" : "pass" }))
              if (!failed) {
                setLog((l) => [
                  ...l,
                  { time: stamp(), tag: "PENDING", text: `${CHECKS[t][LOCAL_COUNT[t]]}` },
                ])
              }
            }
          }, delay)
        )
      })
    })
    if (!only) {
      timers.current.push(
        window.setTimeout(
          () => setLog((l) => [...l, { time: stamp(), tag: "DONE", text: "Local checks finished. Store connection checks run once Google Play is connected.", strong: true }]),
          delay + 250
        )
      )
    }
  }

  const allPassed = targets.length > 0 && targets.every((t) => status[t] === "pass")
  const anyRunning = targets.some((t) => status[t] === "running")

  return { targets, progress, status, latency, log, run, allPassed, anyRunning }
}

export type Verification = ReturnType<typeof useVerification>
