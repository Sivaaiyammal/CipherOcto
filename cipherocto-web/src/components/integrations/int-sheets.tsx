import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Field, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  CATALOG,
  CATEGORY_LABEL,
  deliveriesFor,
  EVENT_TYPES,
  SCOPES,
  type ApiKey,
  type Integration,
  type Provider,
  type Webhook,
} from "@/data/integrations"
import { cn } from "@/lib/utils"

// ── Configure ──────────────────────────────────────────────────────────────

export function ConfigureSheet({
  open,
  onOpenChange,
  integration,
  onSave,
  onDisconnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration | null
  onSave: (id: string, paused: boolean) => void
  onDisconnect: (id: string) => void
}) {
  const [active, setActive] = React.useState(integration ? integration.status !== "paused" : true)
  if (!integration) return null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{integration.name}</SheetTitle>
          <SheetDescription>{integration.subtitle}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-background p-4">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Sync enabled</p>
              <p className="text-xs text-muted-foreground">Pausing stops event delivery. Credentials stay stored.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Sync enabled" />
          </div>
          <dl className="space-y-2 text-[13px]">
            {integration.meta.map((m) => (
              <div key={m.label} className="flex justify-between gap-3 rounded-lg bg-background p-2.5">
                <dt className="text-muted-foreground">{m.label}</dt>
                <dd className={cn("min-w-0 truncate text-right font-semibold", m.mono && "font-mono text-xs")} title={m.value}>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="rounded-xl bg-amber-surface p-3 text-xs text-amber">
            Credentials are shown masked. To change a secret, disconnect and reconnect the integration.
          </p>
        </div>
        <SheetFooter className="flex-row justify-between border-t">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onDisconnect(integration.id)
              onOpenChange(false)
            }}
          >
            Disconnect
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(integration.id, !active)
                onOpenChange(false)
              }}
            >
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Connect new ────────────────────────────────────────────────────────────

export function ConnectSheet({
  open,
  onOpenChange,
  connectedNames,
  onConnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectedNames: string[]
  onConnect: (p: Provider) => void
}) {
  const available = CATALOG.filter((p) => !connectedNames.includes(p.name))
  const [providerId, setProviderId] = React.useState(available[0]?.id ?? "")
  const [secret, setSecret] = React.useState("")
  const [attempted, setAttempted] = React.useState(false)
  const provider = available.find((p) => p.id === providerId)
  const error = attempted && secret.trim().length < 12 ? `Enter the ${provider?.keyLabel.toLowerCase() ?? "credential"} (at least 12 characters).` : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Connect New Integration</SheetTitle>
          <SheetDescription>Credentials are encrypted in the HSM enclave and never shown again in full.</SheetDescription>
        </SheetHeader>
        {available.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Every available provider is already connected.</p>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <Field id="int-provider" label="Provider">
                <SelectInput
                  id="int-provider"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  options={available.map((p) => ({ value: p.id, label: `${p.name} — ${CATEGORY_LABEL[p.category]}` }))}
                />
              </Field>
              {provider && <p className="rounded-lg bg-background p-3 text-xs text-muted-foreground">{provider.subtitle}</p>}
              <Field id="int-secret" label={provider?.keyLabel ?? "Credential"} required error={error}>
                <TextInput id="int-secret" mono type="password" value={secret} placeholder="••••••••••••••••" onChange={(e) => setSecret(e.target.value)} error={error} />
              </Field>
            </div>
            <SheetFooter className="flex-row justify-end border-t">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setAttempted(true)
                  if (!provider || secret.trim().length < 12) return
                  onConnect(provider)
                  onOpenChange(false)
                }}
              >
                Connect
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── New webhook ────────────────────────────────────────────────────────────

export function WebhookSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (w: Pick<Webhook, "name" | "url" | "events">) => void
}) {
  const [name, setName] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [events, setEvents] = React.useState<string[]>([])
  const [attempted, setAttempted] = React.useState(false)

  const errors: { name?: string; url?: string; events?: string } = {}
  if (!name.trim()) errors.name = "Name the destination."
  if (!/^https:\/\/[^\s/$.?#][^\s]*$/i.test(url.trim())) errors.url = "Use a full https:// URL."
  if (events.length === 0) errors.events = "Subscribe to at least one event."
  const shown = attempted ? errors : {}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>New Webhook Endpoint</SheetTitle>
          <SheetDescription>Deliveries are signed with HMAC SHA-256. A signing secret is generated for you.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="wh-name" label="Destination name" required error={shown.name}>
            <TextInput id="wh-name" value={name} placeholder="Billing reconciliation relay" onChange={(e) => setName(e.target.value)} error={shown.name} />
          </Field>
          <Field id="wh-url" label="Endpoint URL" required error={shown.url} hint="HTTPS only. Plain HTTP endpoints are rejected.">
            <TextInput id="wh-url" mono value={url} placeholder="https://api.example.com/hooks/octo" onChange={(e) => setUrl(e.target.value)} error={shown.url} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-foreground">Subscribed events</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EVENT_TYPES.map((e) => (
                <label key={e} className="flex items-center gap-2 rounded-lg bg-background p-2 font-mono text-xs">
                  <Checkbox
                    checked={events.includes(e)}
                    onCheckedChange={(c) => setEvents((list) => (c === true ? [...list, e] : list.filter((x) => x !== e)))}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  {e}
                </label>
              ))}
            </div>
            {shown.events && <p className="mt-1 text-xs font-medium text-destructive">{shown.events}</p>}
          </fieldset>
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setAttempted(true)
              if (errors.name || errors.url || errors.events) return
              onCreate({ name: name.trim(), url: url.trim(), events })
              onOpenChange(false)
            }}
          >
            Create endpoint
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Delivery logs ──────────────────────────────────────────────────────────

export function LogsSheet({ open, onOpenChange, webhook }: { open: boolean; onOpenChange: (open: boolean) => void; webhook: Webhook | null }) {
  if (!webhook) return null
  const seed = webhook.id.charCodeAt(webhook.id.length - 1)
  const rows = deliveriesFor(seed)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Delivery logs — {webhook.name}</SheetTitle>
          <SheetDescription className="break-all font-mono">{webhook.url}</SheetDescription>
        </SheetHeader>
        <ul className="space-y-2 overflow-y-auto p-4 text-[13px]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-background p-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-foreground">{r.event}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {r.id} · {r.ago}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">{r.ms}ms</span>
                <span className={cn("rounded px-1.5 py-0.5 font-mono text-[11px] font-bold", r.status === 200 ? "bg-mint-border text-mint" : "bg-pink-hover text-pink")}>{r.status}</span>
              </span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}

// ── Generate API key ───────────────────────────────────────────────────────

export function KeySheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (k: Omit<ApiKey, "id" | "used">) => string
}) {
  const [name, setName] = React.useState("")
  const [env, setEnv] = React.useState<ApiKey["env"]>("Sandbox")
  const [scopes, setScopes] = React.useState<string[]>(["read:all"])
  const [attempted, setAttempted] = React.useState(false)
  const [created, setCreated] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const errors: { name?: string; scopes?: string } = {}
  if (!name.trim()) errors.name = "Name the key so you can find it later."
  if (scopes.length === 0) errors.scopes = "Grant at least one scope."
  const shown = attempted ? errors : {}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{created ? "Key generated" : "Generate API Key"}</SheetTitle>
          <SheetDescription>{created ? "Copy it now — this is the only time the full key is shown." : "Scope keys to the minimum they need."}</SheetDescription>
        </SheetHeader>
        {created ? (
          <div className="flex-1 space-y-4 p-4">
            <p className="break-all rounded-xl bg-background p-4 font-mono text-[13px] text-foreground">{created}</p>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created)
                } catch {
                  /* ignore */
                }
                setCopied(true)
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy key"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <Field id="key-name" label="Key name" required error={shown.name}>
                <TextInput id="key-name" value={name} placeholder="Analytics export job" onChange={(e) => setName(e.target.value)} error={shown.name} />
              </Field>
              <Field id="key-env" label="Environment">
                <SelectInput
                  id="key-env"
                  value={env}
                  onChange={(e) => setEnv(e.target.value as ApiKey["env"])}
                  options={[
                    { value: "Production", label: "Production" },
                    { value: "Sandbox", label: "Sandbox" },
                    { value: "Automations", label: "Automations (CI)" },
                  ]}
                />
              </Field>
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-foreground">Scopes</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SCOPES.map((s) => (
                    <label key={s} className="flex items-center gap-2 rounded-lg bg-background p-2 font-mono text-xs">
                      <Checkbox
                        checked={scopes.includes(s)}
                        onCheckedChange={(c) => setScopes((list) => (c === true ? [...list, s] : list.filter((x) => x !== s)))}
                        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      {s}
                    </label>
                  ))}
                </div>
                {shown.scopes && <p className="mt-1 text-xs font-medium text-destructive">{shown.scopes}</p>}
              </fieldset>
            </div>
            <SheetFooter className="flex-row justify-end border-t">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setAttempted(true)
                  if (errors.name || errors.scopes) return
                  setCreated(onCreate({ name: name.trim(), env, scopes, value: "" }))
                }}
              >
                Generate
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
