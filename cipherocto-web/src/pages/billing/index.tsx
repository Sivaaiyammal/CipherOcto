import * as React from "react"
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Field, Pill, SectionCard, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import {
  billingApi,
  ENTITLEMENT_RE,
  PACKAGE_NAME_RE,
  PLAY_PRODUCT_ID_RE,
  type BackendApp,
  type ProductMapping,
  type ProductStatus,
  type SdkKey,
  type SubscriptionEvent,
  type SubscriptionSummary,
} from "@/lib/billing-api"
import { NO_ACCESS_HINT } from "@/lib/permissions"

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Try again.")
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—")

/** Loads data on mount and whenever `deps` change; exposes a reload. */
function useLoad<T>(load: (signal: AbortSignal) => Promise<T>, deps: React.DependencyList, enabled = true) {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(enabled)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    load(ctrl.signal)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(errorText(e))
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled])

  return { data, error, loading, reload: () => setTick((t) => t + 1) }
}

export default function BillingSetupPage() {
  const { can } = useAuth()
  const canWriteApps = can("apps:write")
  const apps = useLoad((s) => billingApi.listApps(s), [])
  const [picked, setPicked] = React.useState<string | null>(null)
  const [registering, setRegistering] = React.useState(false)

  // Default to the first app until the user picks one.
  const app = apps.data?.find((a) => a.id === picked) ?? apps.data?.[0] ?? null
  const selected = app?.id ?? null
  const setSelected = setPicked

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.02em] text-foreground">Billing Setup</h1>
        <p className="text-sm text-muted-foreground">
          Connect an app to the CipherOcto billing SDK: register it, create an SDK key, and map its Google Play
          subscriptions to entitlements.
        </p>
      </header>

      <SectionCard
        title="Registered apps"
        description="Apps that can use the billing SDK. Package name must match the Play listing."
        aside={
          <Button
            className="rounded-xl"
            disabled={!canWriteApps}
            title={canWriteApps ? undefined : NO_ACCESS_HINT}
            onClick={() => setRegistering((v) => !v)}
          >
            <PlusIcon /> Register app
          </Button>
        }
      >
        {registering && (
          <RegisterAppForm
            onDone={(created) => {
              setRegistering(false)
              if (created) {
                setSelected(created.id)
                apps.reload()
              }
            }}
          />
        )}
        {apps.loading && !apps.data ? (
          <p className="text-sm text-muted-foreground">Loading apps…</p>
        ) : apps.error ? (
          <ErrorLine message={apps.error} onRetry={apps.reload} />
        ) : apps.data?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {apps.data.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a.id)}
                  aria-pressed={a.id === selected}
                  className={`flex w-full flex-col gap-1 rounded-xl p-4 text-left shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-foreground/[0.03] ${
                    a.id === selected ? "bg-foreground/[0.04] shadow-[inset_0_0_0_2px_var(--primary)]" : "bg-background"
                  }`}
                >
                  <span className="text-[15px] font-semibold text-foreground">{a.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{a.packageName}</span>
                  <span className="mt-1">
                    <Pill tone={a.status === "production" ? "mint" : "muted"}>{a.status.toUpperCase()}</Pill>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No apps registered yet. Use “Register app” to add the first.</p>
        )}
      </SectionCard>

      {app && (
        <>
          {/* keyed so a one-time secret never carries over to another app */}
          <SdkKeysSection key={app.id} app={app} />
          <ProductsSection app={app} />
          <HealthSection app={app} />
        </>
      )}
    </div>
  )
}

function ErrorLine({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertTriangleIcon className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

function RegisterAppForm({ onDone }: { onDone: (created: BackendApp | null) => void }) {
  const [name, setName] = React.useState("")
  const [packageName, setPackageName] = React.useState("")
  const [attempted, setAttempted] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = "Enter a name."
  if (!PACKAGE_NAME_RE.test(packageName.trim())) errors.packageName = "Use a package name like com.company.app."
  const shown = attempted ? errors : {}

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError(null)
    try {
      onDone(await billingApi.createApp({ name: name.trim(), packageName: packageName.trim() }))
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "An app with that package name already exists." : errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-xl bg-background p-4 sm:grid-cols-2">
      <Field id="app-name" label="App name" required error={shown.name}>
        <TextInput id="app-name" value={name} onChange={(e) => setName(e.target.value)} error={shown.name} placeholder="HabitOcto" />
      </Field>
      <Field id="app-package" label="Package name" required error={shown.packageName} hint="Must match the Play listing.">
        <TextInput
          id="app-package"
          mono
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          error={shown.packageName}
          placeholder="com.company.habitocto"
        />
      </Field>
      {error && <div className="sm:col-span-2"><ErrorLine message={error} /></div>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" className="rounded-xl" disabled={busy}>
          {busy ? "Registering…" : "Register"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onDone(null)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function SdkKeysSection({ app }: { app: BackendApp }) {
  const { can } = useAuth()
  const allowed = can("apps:write") // key management is gated on write: keys are credentials
  const keys = useLoad((s) => billingApi.listKeys(app.id, s), [app.id], allowed)
  const [label, setLabel] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [secret, setSecret] = React.useState<{ keyId: string; value: string } | null>(null)
  const [copied, setCopied] = React.useState(false)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await billingApi.createKey(app.id, label.trim())
      setSecret({ keyId: r.key.id, value: r.secret })
      setCopied(false)
      setLabel("")
      keys.reload()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (k: SdkKey) => {
    if (!window.confirm(`Revoke key ${k.prefix}…? Apps using it will stop working immediately.`)) return
    setError(null)
    try {
      await billingApi.revokeKey(app.id, k.id)
      keys.reload()
    } catch (e) {
      setError(errorText(e))
    }
  }

  const copy = async () => {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret.value)
      setCopied(true)
    } catch {
      setError("Couldn't copy automatically. Select the key and copy it manually.")
    }
  }

  return (
    <SectionCard
      title="SDK keys"
      description={`Keys the ${app.name} app uses to reach the billing API. A key identifies the app; it can't grant access by itself.`}
    >
      {!allowed ? (
        <p className="text-sm text-muted-foreground">{NO_ACCESS_HINT}</p>
      ) : (
        <>
          {secret && (
            <div role="status" className="flex flex-col gap-2 rounded-xl bg-mint-border/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheckIcon className="size-4" /> Copy this key now — it won't be shown again.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 font-mono text-[13px] break-all select-all">
                  {secret.value}
                </code>
                <Button variant="outline" className="rounded-xl" onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={() => setSecret(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field id="key-label" label="Label" className="flex-1" hint="e.g. production, internal-testing">
              <TextInput id="key-label" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />
            </Field>
            <Button className="rounded-xl" disabled={busy} onClick={create}>
              <KeyRoundIcon /> {busy ? "Creating…" : "Create key"}
            </Button>
          </div>

          {error && <ErrorLine message={error} />}
          {keys.error && <ErrorLine message={keys.error} onRetry={keys.reload} />}

          {keys.data && keys.data.length > 0 && (
            <ul className="divide-y divide-border rounded-xl bg-background">
              {keys.data.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <code className="font-mono text-[13px]">{k.prefix}…</code>
                  <span className="text-muted-foreground">{k.label || "No label"}</span>
                  <span className="text-xs text-muted-foreground">Created {when(k.createdAt)}</span>
                  <span className="text-xs text-muted-foreground">Last used {when(k.lastUsedAt)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {k.revokedAt ? (
                      <Pill>REVOKED</Pill>
                    ) : (
                      <>
                        <Pill tone="mint">ACTIVE</Pill>
                        <Button size="sm" variant="outline" onClick={() => revoke(k)}>
                          Revoke
                        </Button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {keys.data?.length === 0 && <p className="text-sm text-muted-foreground">No keys yet. Create one to start integrating.</p>}
        </>
      )}
    </SectionCard>
  )
}

const NEXT_STATUS: Record<ProductStatus, { to: ProductStatus; label: string }[]> = {
  draft: [{ to: "active", label: "Activate" }],
  active: [{ to: "archived", label: "Archive" }],
  archived: [{ to: "active", label: "Reactivate" }],
}

function ProductsSection({ app }: { app: BackendApp }) {
  const { can } = useAuth()
  const canRead = can("subscriptions:read")
  const canWrite = can("subscriptions:write")
  const products = useLoad((s) => billingApi.listProducts(app.id, s), [app.id], canRead)
  const [form, setForm] = React.useState({ productId: "", entitlement: "premium", displayName: "", status: "active" as ProductStatus })
  const [attempted, setAttempted] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const errors: Record<string, string> = {}
  if (!PLAY_PRODUCT_ID_RE.test(form.productId)) errors.productId = "Use the subscription ID from Play Console (lowercase, digits, . _ -)."
  if (!ENTITLEMENT_RE.test(form.entitlement)) errors.entitlement = "Use a short key like premium or pro_plus."
  if (!form.displayName.trim()) errors.displayName = "Enter a display name."
  const shown = attempted ? errors : {}

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError(null)
    try {
      await billingApi.createProduct(app.id, { ...form, displayName: form.displayName.trim() })
      setForm({ productId: "", entitlement: form.entitlement, displayName: "", status: "active" })
      setAttempted(false)
      products.reload()
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "That product is already mapped for this app." : errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (p: ProductMapping, status: ProductStatus) => {
    setError(null)
    try {
      await billingApi.setProductStatus(app.id, p.id, status)
      products.reload()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <SectionCard
      title="Products"
      description="Map a Play Console subscription to the entitlement your app checks. This doesn't create anything in Play Console."
    >
      {!canRead ? (
        <p className="text-sm text-muted-foreground">{NO_ACCESS_HINT}</p>
      ) : (
        <>
          {canWrite && (
            <form onSubmit={add} noValidate className="grid gap-4 rounded-xl bg-background p-4 md:grid-cols-4">
              <Field id="p-id" label="Play product ID" required error={shown.productId}>
                <TextInput
                  id="p-id"
                  mono
                  value={form.productId}
                  placeholder="pro_monthly"
                  error={shown.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value.trim().toLowerCase() }))}
                />
              </Field>
              <Field id="p-ent" label="Entitlement key" required error={shown.entitlement}>
                <TextInput
                  id="p-ent"
                  mono
                  value={form.entitlement}
                  error={shown.entitlement}
                  onChange={(e) => setForm((f) => ({ ...f, entitlement: e.target.value.trim().toLowerCase() }))}
                />
              </Field>
              <Field id="p-name" label="Display name" required error={shown.displayName}>
                <TextInput
                  id="p-name"
                  value={form.displayName}
                  placeholder="Pro Monthly"
                  error={shown.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                />
              </Field>
              <Field id="p-status" label="Status">
                <SelectInput
                  id="p-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                  ]}
                />
              </Field>
              <div className="md:col-span-4">
                <Button type="submit" className="rounded-xl" disabled={busy}>
                  <PlusIcon /> {busy ? "Adding…" : "Add product"}
                </Button>
              </div>
            </form>
          )}

          {error && <ErrorLine message={error} />}
          {products.error && <ErrorLine message={products.error} onRetry={products.reload} />}

          {products.data && products.data.length > 0 && (
            <ul className="divide-y divide-border rounded-xl bg-background">
              {products.data.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-semibold text-foreground">{p.displayName}</span>
                  <code className="font-mono text-[13px] text-muted-foreground">{p.productId}</code>
                  <span className="text-xs text-muted-foreground">
                    unlocks <code className="font-mono">{p.entitlement}</code>
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Pill tone={p.status === "active" ? "mint" : "muted"}>{p.status.toUpperCase()}</Pill>
                    {canWrite &&
                      NEXT_STATUS[p.status].map((n) => (
                        <Button key={n.to} size="sm" variant="outline" onClick={() => setStatus(p, n.to)}>
                          {n.label}
                        </Button>
                      ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {products.data?.length === 0 && <p className="text-sm text-muted-foreground">No products mapped yet.</p>}
        </>
      )}
    </SectionCard>
  )
}

function HealthSection({ app }: { app: BackendApp }) {
  const { can } = useAuth()
  const allowed = can("subscriptions:read")
  const summary = useLoad<SubscriptionSummary>((s) => billingApi.summary(app.id, s), [app.id], allowed)
  const events = useLoad<SubscriptionEvent[]>((s) => billingApi.events(app.id, s), [app.id], allowed)

  if (!allowed) return null
  const s = summary.data

  return (
    <SectionCard
      title="Integration health"
      description="Is the backend able to verify purchases for this app, and what has it seen recently?"
      aside={
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            summary.reload()
            events.reload()
          }}
        >
          <RefreshCwIcon /> Refresh
        </Button>
      }
    >
      {summary.error && <ErrorLine message={summary.error} onRetry={summary.reload} />}
      {s && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Purchase verification" value={s.verificationConfigured ? "Configured" : "Not configured"} ok={s.verificationConfigured} />
          <Stat label="Real-time notifications" value={s.notificationsConfigured ? "Configured" : "Not configured"} ok={s.notificationsConfigured} />
          <Stat label="Active entitlements" value={String(s.activeEntitlements)} />
          <Stat label="Last verified" value={when(s.lastVerifiedAt)} />
        </div>
      )}
      {s && !s.verificationConfigured && (
        <p className="text-sm text-muted-foreground">
          Without Google credentials on the API, purchases are never unlocked (verification returns 503). Set
          GOOGLE_PLAY_SERVICE_ACCOUNT_JSON on the server.
        </p>
      )}

      <h3 className="text-sm font-semibold text-foreground">Recent events</h3>
      {events.error && <ErrorLine message={events.error} onRetry={events.reload} />}
      {events.data && events.data.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl bg-background text-sm">
          {events.data.map((ev) => (
            <li key={ev.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
              <span className="font-mono text-[13px] text-foreground">{ev.type}</span>
              <Pill>{ev.source.toUpperCase()}</Pill>
              <span className="text-xs text-muted-foreground">{when(ev.at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        !events.loading && !events.error && <p className="text-sm text-muted-foreground">No events yet.</p>
      )}
    </SectionCard>
  )
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-[15px] font-semibold ${ok === false ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  )
}
