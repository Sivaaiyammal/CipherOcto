import * as React from "react"

import type { RegisterDraft } from "@/data/register"

export type ProbeStatus = "idle" | "running" | "pass"
export type Target = "apple" | "google" | "webhook"
type LogLine = { time: string; tag: string; text: string; strong?: boolean }

export const CHECKS: Record<Target, string[]> = {
  apple: ["JWT ES256 signature generation", "Apple root CA chain verified", "Server-to-Server V2 test ping", "Sandbox receipt decoded"],
  google: ["OAuth2 token exchanged (androidpublisher)", "Pub/Sub push handshake ACK", "RTDN event simulation verified", "SUBSCRIPTION_PURCHASED parsed"],
  webhook: ["HMAC-SHA256 test dispatch signed & verified"],
}

const stamp = () => {
  const d = new Date()
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`
}

/**
 * Simulated verification run until the CipherOcto verification API exists.
 * Probes complete one check at a time so the UI shows real progress.
 */
export function useVerification(draft: RegisterDraft) {
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
  const [latency, setLatency] = React.useState<Record<Target, number>>({ apple: 0, google: 0, webhook: 0 })
  const [log, setLog] = React.useState<LogLine[]>([])
  const timers = React.useRef<number[]>([])

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const detail: Record<Target, (i: number, ms: number) => LogLine> = {
    apple: (i, ms) =>
      [
        { time: stamp(), tag: "JWT", text: `ES256 token signed with key ${draft.ios.keyId} (issuer ${draft.ios.issuerId.slice(0, 8)}…)` },
        { time: stamp(), tag: "TLS1.3", text: "Handshake completed: api.storekit.itunes.apple.com (TLS_AES_256_GCM_SHA384)" },
        { time: stamp(), tag: "HTTP200", text: `POST /inApps/v1/notifications/test → 200 OK in ${ms}ms for ${draft.ios.bundleId}` },
        { time: stamp(), tag: "RECEIPT", text: "Sandbox signedTransactionInfo decoded and chain-verified" },
      ][i],
    google: (i, ms) =>
      [
        { time: stamp(), tag: "AUTH", text: `OAuth2 token exchanged for ${draft.android.serviceAccountEmail ?? "service account"}` },
        { time: stamp(), tag: "PUBSUB", text: `Push ACK 200 on ${draft.android.topic.split("/").slice(-2).join("/")} (${ms}ms)` },
        { time: stamp(), tag: "RTDN", text: `Test notification for ${draft.android.packageName} received` },
        { time: stamp(), tag: "PARSE", text: "SUBSCRIPTION_PURCHASED (notificationType 4) parsed" },
      ][i],
    webhook: (_i, ms) => ({
      time: stamp(),
      tag: "HMAC",
      text: `Test event dispatched to ${draft.webhook.url} — signature VERIFIED (${ms}ms)`,
    }),
  }

  const run = (only?: Target) => {
    const list = only ? [only] : targets
    if (!only) setLog([{ time: stamp(), tag: "INIT", text: `Starting verification for ${draft.name || "new app"}`, strong: true }])
    let delay = 150
    list.forEach((t) => {
      const ms = Math.round(18 + Math.random() * 30)
      setStatus((s) => ({ ...s, [t]: "running" }))
      setProgress((p) => ({ ...p, [t]: 0 }))
      CHECKS[t].forEach((_, i) => {
        delay += 380
        timers.current.push(
          window.setTimeout(() => {
            setProgress((p) => ({ ...p, [t]: i + 1 }))
            setLog((l) => [...l, detail[t](i, ms)])
            if (i === CHECKS[t].length - 1) {
              setStatus((s) => ({ ...s, [t]: "pass" }))
              setLatency((lat) => ({ ...lat, [t]: ms }))
            }
          }, delay)
        )
      })
    })
    if (!only) {
      timers.current.push(
        window.setTimeout(
          () => setLog((l) => [...l, { time: stamp(), tag: "FINISH", text: `All ${list.length} probe groups validated. Readiness 100/100.`, strong: true }]),
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
