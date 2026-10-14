import * as React from "react"
import { ChevronRightIcon, Loader2Icon, PlusIcon, RadioTowerIcon, XIcon } from "lucide-react"

import { ConnectorGrid, type TestState } from "@/components/integrations/connector-grid"
import { ConfigureSheet, ConnectSheet, KeySheet, LogsSheet, WebhookSheet } from "@/components/integrations/int-sheets"
import { IntegrationKpis } from "@/components/integrations/int-kpis"
import { HsmPanel, KeysPanel } from "@/components/integrations/keys-panel"
import { WebhooksPanel } from "@/components/integrations/webhooks-panel"
import {
  randomHex,
  SEED_INTEGRATIONS,
  SEED_KEYS,
  SEED_WEBHOOKS,
  type ApiKey,
  type Integration,
  type Provider,
  type Webhook,
} from "@/data/integrations"
import { downloadFile } from "@/lib/download"
import { hashString } from "@/lib/seeded-random"

/** Deterministic-ish round-trip time so repeated tests look like real measurements. */
const roundTrip = (id: string, n: number) => 12 + (hashString(`${id}:${n}`) % 38)

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = React.useState<Integration[]>(SEED_INTEGRATIONS)
  const [webhooks, setWebhooks] = React.useState<Webhook[]>(SEED_WEBHOOKS)
  const [keys, setKeys] = React.useState<ApiKey[]>(SEED_KEYS)
  const [tests, setTests] = React.useState<Record<string, TestState>>({})
  const [testing, setTesting] = React.useState<Set<string>>(new Set())
  const [runAll, setRunAll] = React.useState<{ running: boolean; summary: string | null }>({ running: false, summary: null })
  const [runCount, setRunCount] = React.useState(0)

  const [configuring, setConfiguring] = React.useState<Integration | null>(null)
  const [configKey, setConfigKey] = React.useState(0)
  const [connectOpen, setConnectOpen] = React.useState(false)
  const [webhookOpen, setWebhookOpen] = React.useState(false)
  const [logsFor, setLogsFor] = React.useState<Webhook | null>(null)
  const [keyOpen, setKeyOpen] = React.useState(false)

  const settle = (id: string, paused: boolean): TestState => (paused ? { state: "fail" } : { state: "ok", ms: roundTrip(id, runCount + 1) })

  const testIntegration = (i: Integration) => {
    setRunCount((n) => n + 1)
    setTests((t) => ({ ...t, [i.id]: { state: "running" } }))
    window.setTimeout(() => setTests((t) => ({ ...t, [i.id]: settle(i.id, i.status === "paused") })), 700)
  }

  const testWebhook = (w: Webhook) => {
    setRunCount((n) => n + 1)
    setTesting((s) => new Set(s).add(w.id))
    window.setTimeout(() => {
      const ms = roundTrip(w.id, runCount + 1)
      setWebhooks((list) => list.map((x) => (x.id === w.id ? { ...x, latency: `${ms}ms avg • test OK` } : x)))
      setTesting((s) => {
        const next = new Set(s)
        next.delete(w.id)
        return next
      })
    }, 700)
  }

  const testAll = () => {
    const targetsI = integrations.filter((i) => i.status !== "paused")
    const targetsW = webhooks.filter((w) => !w.paused)
    setRunAll({ running: true, summary: null })
    setTests((t) => ({ ...t, ...Object.fromEntries(targetsI.map((i) => [i.id, { state: "running" } as TestState])) }))
    setTesting(new Set(targetsW.map((w) => w.id)))
    targetsI.forEach((i, idx) =>
      window.setTimeout(() => setTests((t) => ({ ...t, [i.id]: { state: "ok", ms: roundTrip(i.id, 100 + idx) } })), 350 + idx * 120)
    )
    const finish = 350 + targetsI.length * 120 + 250
    window.setTimeout(() => {
      setWebhooks((list) => list.map((w) => (w.paused ? w : { ...w, latency: `${roundTrip(w.id, 100)}ms avg • test OK` })))
      setTesting(new Set())
      setRunAll({
        running: false,
        summary: `Tested ${targetsI.length + targetsW.length} endpoints · ${targetsI.length + targetsW.length} passed · 0 failed${
          integrations.length > targetsI.length ? ` · ${integrations.length - targetsI.length} paused skipped` : ""
        }`,
      })
    }, finish)
  }

  const connect = (p: Provider) =>
    setIntegrations((list) => [
      {
        id: `${p.id}-${randomHex(2)}`,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        icon: p.icon,
        status: "live",
        chip: "Live Sync",
        meta: [
          { label: "Credential", value: `••••••${randomHex(2)}`, mono: true },
          { label: "Connected By", value: "Elena Rostova" },
          { label: "Sync Mode", value: "Webhook + hourly poll" },
          { label: "First Sync", value: "Pending" },
        ],
        healthLine: "Connected — waiting for first event",
        testLabel: "Send Test Ping",
        configLabel: "Configure",
      },
      ...list,
    ])

  return (
    <>
      <section className="flex flex-col gap-4 px-4 lg:px-6 @7xl/main:flex-row @7xl/main:items-end @7xl/main:justify-between">
        <div className="max-w-3xl space-y-1">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Platform</span>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-semibold text-foreground">Integrations &amp; API Hub</span>
          </p>
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Integrations &amp; Webhooks</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Connect App Store Connect, Google Play, Stripe, telemetry destinations, and configure real-time cryptographic webhook endpoints
            across multi-tenant production fleets.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={testAll}
            disabled={runAll.running}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-card px-4 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04] disabled:opacity-70"
          >
            {runAll.running ? <Loader2Icon className="size-4 animate-spin" /> : <RadioTowerIcon className="size-4" />}
            {runAll.running ? "Testing…" : "Test All Endpoints"}
          </button>
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-2)] hover:bg-primary/90"
          >
            <PlusIcon className="size-4" />
            Connect New Integration
          </button>
        </div>
      </section>

      {runAll.summary && (
        <div role="status" className="mx-4 flex items-center justify-between gap-3 rounded-xl bg-mint-surface px-4 py-3 text-[13px] font-semibold text-mint lg:mx-6">
          {runAll.summary}
          <button type="button" aria-label="Dismiss" onClick={() => setRunAll((r) => ({ ...r, summary: null }))} className="rounded p-0.5 hover:bg-mint-border">
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      <IntegrationKpis integrations={integrations} webhooks={webhooks} keys={keys} />

      <ConnectorGrid
        integrations={integrations}
        tests={tests}
        onTest={testIntegration}
        onConfigure={(i) => {
          setConfiguring(i)
          setConfigKey((k) => k + 1)
        }}
        onTogglePause={(i) =>
          setIntegrations((list) => list.map((x) => (x.id === i.id ? { ...x, status: "live", chip: "Live Sync", healthLine: "Resumed — catching up on queued events" } : x)))
        }
      />

      <WebhooksPanel
        webhooks={webhooks}
        testing={testing}
        onNew={() => setWebhookOpen(true)}
        onTest={testWebhook}
        onLogs={(w) => setLogsFor(w)}
        onRotate={(w) => setWebhooks((list) => list.map((x) => (x.id === w.id ? { ...x, secret: `whsec_${randomHex(8)}` } : x)))}
        onTogglePause={(w) => setWebhooks((list) => list.map((x) => (x.id === w.id ? { ...x, paused: !x.paused } : x)))}
        onDelete={(w) => setWebhooks((list) => list.filter((x) => x.id !== w.id))}
      />

      <div className="grid grid-cols-1 gap-5 px-4 lg:px-6 @5xl/main:grid-cols-3">
        <div className="min-w-0 @5xl/main:col-span-2">
          <KeysPanel
            keys={keys}
            onGenerate={() => setKeyOpen(true)}
            onRotate={(k) =>
              setKeys((list) =>
                list.map((x) => (x.id === k.id ? { ...x, value: `${x.value.split("_").slice(0, 2).join("_")}_${randomHex(2)}...${randomHex(2)}`, used: "Rotated just now" } : x))
              )
            }
          />
        </div>
        <div className="min-w-0">
          <HsmPanel
            onAttest={() =>
              downloadFile(
                "cloudhsm-attestation.json",
                JSON.stringify({ cluster: "us-east-1-hsm-04", standard: "FIPS 140-2 Level 3", rotation: "30d automated", nextRotation: "2024-11-27", generatedBy: "Elena Rostova" }, null, 2),
                "application/json"
              )
            }
          />
        </div>
      </div>

      <ConfigureSheet
        key={configKey}
        open={configuring !== null}
        onOpenChange={(open) => !open && setConfiguring(null)}
        integration={configuring}
        onSave={(id, paused) =>
          setIntegrations((list) =>
            list.map((x) =>
              x.id === id
                ? paused
                  ? { ...x, status: "paused", chip: "Paused", healthLine: "Paused — events are queued, not delivered" }
                  : x.status === "paused"
                    ? { ...x, status: "live", chip: "Live Sync", healthLine: "Resumed — catching up on queued events" }
                    : x
                : x
            )
          )
        }
        onDisconnect={(id) => setIntegrations((list) => list.filter((x) => x.id !== id))}
      />
      <ConnectSheet
        key={`connect-${connectOpen}`}
        open={connectOpen}
        onOpenChange={setConnectOpen}
        connectedNames={integrations.map((i) => i.name)}
        onConnect={connect}
      />
      <WebhookSheet
        key={`wh-${webhookOpen}`}
        open={webhookOpen}
        onOpenChange={setWebhookOpen}
        onCreate={(w) =>
          setWebhooks((list) => [
            { id: `w-${randomHex(3)}`, ...w, secret: `whsec_${randomHex(8)}`, sla: "100.0%", latency: "No deliveries yet", paused: false },
            ...list,
          ])
        }
      />
      <LogsSheet open={logsFor !== null} onOpenChange={(open) => !open && setLogsFor(null)} webhook={logsFor} />
      <KeySheet
        key={`key-${keyOpen}`}
        open={keyOpen}
        onOpenChange={setKeyOpen}
        onCreate={(k) => {
          const prefix = k.env === "Production" ? "octo_live" : k.env === "Sandbox" ? "octo_test" : "octo_srv"
          const full = `${prefix}_${randomHex(16)}`
          setKeys((list) => [{ id: `k-${randomHex(3)}`, name: k.name, env: k.env, scopes: k.scopes, value: `${full.slice(0, 13)}...${full.slice(-4)}`, used: "Never used" }, ...list])
          return full
        }}
      />
    </>
  )
}
