import * as React from "react"
import { Link } from "react-router-dom"
import { AlertTriangleIcon, CheckIcon, ExternalLinkIcon, FileUpIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react"

import { CopyBox, Field, Pill, SectionCard, SelectInput, TextInput, inputClass } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import {
  billingApi,
  SLUG_RE,
  type BackendApp,
  type PolicyVersion,
  type PrivacyPolicyOverview,
} from "@/lib/billing-api"
import { NO_ACCESS_HINT } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const MAX_CHARS = 500_000
const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Try again.")
const when = (iso: string) => new Date(iso).toLocaleString()

/** Origin shown in the public URL. Set VITE_PUBLIC_BASE_URL when the site lives elsewhere. */
const PUBLIC_BASE = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.replace(/\/+$/, "") || window.location.origin

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

export default function PoliciesPage() {
  const { can } = useAuth()
  const canWrite = can("apps:write")

  const [apps, setApps] = React.useState<BackendApp[] | null>(null)
  const [appsError, setAppsError] = React.useState<string | null>(null)
  const [pickedId, setPickedId] = React.useState<string | null>(null)

  const loadApps = React.useCallback((signal?: AbortSignal) => {
    setAppsError(null)
    billingApi
      .listApps(signal)
      .then(setApps)
      .catch((e) => {
        if (!signal?.aborted) setAppsError(errorText(e))
      })
  }, [])

  React.useEffect(() => {
    const ctrl = new AbortController()
    loadApps(ctrl.signal)
    return () => ctrl.abort()
  }, [loadApps])

  const app = apps?.find((a) => a.id === pickedId) ?? apps?.[0] ?? null

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.02em] text-foreground">Privacy Policies</h1>
        <p className="text-sm text-muted-foreground">
          Upload an HTML file and it is live at <span className="font-mono text-[13px]">{PUBLIC_BASE}/&lt;app&gt;/privacy</span>{" "}
          straight away. Use that link in the Play Console. No server restart needed.
        </p>
      </header>

      {appsError ? (
        <ErrorLine message={appsError} onRetry={() => loadApps()} />
      ) : !apps ? (
        <p className="text-sm text-muted-foreground">Loading apps…</p>
      ) : apps.length === 0 ? (
        <SectionCard title="No apps yet" description="Register an app first; its privacy page lives under the app's URL name.">
          <div>
            <Button asChild className="rounded-xl">
              <Link to="/billing">Register an app</Link>
            </Button>
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="max-w-sm">
            <Field id="policy-app" label="App">
              <SelectInput
                id="policy-app"
                value={app?.id ?? ""}
                onChange={(e) => setPickedId(e.target.value)}
                options={apps.map((a) => ({ value: a.id, label: `${a.name} (${a.packageName})` }))}
              />
            </Field>
          </div>
          {app && (
            <PolicyEditor
              key={app.id}
              app={app}
              canWrite={canWrite}
              onSlugChanged={(updated) => setApps((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? prev)}
            />
          )}
        </>
      )}
    </div>
  )
}

function PolicyEditor({
  app,
  canWrite,
  onSlugChanged,
}: {
  app: BackendApp
  canWrite: boolean
  onSlugChanged: (app: BackendApp) => void
}) {
  const [overview, setOverview] = React.useState<PrivacyPolicyOverview | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [html, setHtml] = React.useState("")
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [publishing, setPublishing] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(
    (signal?: AbortSignal) => {
      setLoadError(null)
      billingApi
        .privacyPolicy(app.id, signal)
        .then((o) => {
          setOverview(o)
          // Start the editor from what is live, but never clobber text the user typed.
          setHtml((prev) => (prev === "" ? (o.current?.html ?? "") : prev))
        })
        .catch((e) => {
          if (!signal?.aborted) setLoadError(errorText(e))
        })
    },
    [app.id]
  )

  React.useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  const publicUrl = `${PUBLIC_BASE}/${overview?.slug ?? app.slug}/privacy`
  const tooLarge = html.length > MAX_CHARS
  const dirty = overview ? html !== (overview.current?.html ?? "") : false

  async function onFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_CHARS * 2) {
      setNotice({ tone: "error", text: "That file is too large. Policies are limited to about 500 KB." })
      return
    }
    setHtml(await file.text())
    setFileName(file.name)
    setNotice(null)
  }

  async function publish() {
    setPublishing(true)
    setNotice(null)
    try {
      const res = await billingApi.publishPrivacyPolicy(app.id, html)
      setNotice({
        tone: "ok",
        text: res.unchanged
          ? `This is already the live version (v${res.policy.version}). Nothing changed.`
          : `Published as v${res.policy.version}. It is live now.`,
      })
      setHtml(res.policy.html) // show what was actually stored (after sanitizing)
      load()
    } catch (e) {
      setNotice({ tone: "error", text: errorText(e) })
    } finally {
      setPublishing(false)
    }
  }

  async function loadVersion(v: PolicyVersion) {
    try {
      const p = await billingApi.privacyPolicyVersion(app.id, v.version)
      setHtml(p.html)
      setFileName(null)
      setNotice({ tone: "ok", text: `Loaded v${v.version} into the editor. Publish it to make it live again.` })
    } catch (e) {
      setNotice({ tone: "error", text: errorText(e) })
    }
  }

  return (
    <>
      <SectionCard
        title="Public link"
        description="Paste this URL into the Play Console's privacy policy field."
        aside={
          overview?.current ? (
            <Pill tone="mint">
              <CheckIcon className="size-3" /> LIVE · v{overview.current.version}
            </Pill>
          ) : (
            <Pill>NOT PUBLISHED</Pill>
          )
        }
      >
        <CopyBox label={<><ShieldCheckIcon className="size-4" /> {app.name}</>} value={publicUrl} />
        <div className="flex flex-wrap items-end gap-3">
          <SlugForm app={app} canWrite={canWrite} onChanged={(updated) => { onSlugChanged(updated); load() }} />
          {overview?.current && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon /> Open page
              </a>
            </Button>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Policy HTML"
        description={
          overview?.current
            ? `Live version v${overview.current.version}, published ${when(overview.current.publishedAt)}${
                overview.current.publishedByEmail ? ` by ${overview.current.publishedByEmail}` : ""
              }.`
            : "Upload an .html file or paste the markup. Scripts, forms and remote resources are removed automatically."
        }
      >
        {loadError && <ErrorLine message={loadError} onRetry={() => load()} />}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".html,.htm,text/html"
            className="sr-only"
            aria-label="Upload policy HTML file"
            onChange={(e) => {
              void onFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={!canWrite}
            title={canWrite ? undefined : NO_ACCESS_HINT}
            onClick={() => fileRef.current?.click()}
          >
            <FileUpIcon /> Choose HTML file
          </Button>
          {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
        </div>

        <Field
          id="policy-html"
          label="HTML"
          hint={`${html.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()} characters`}
          error={tooLarge ? "This is over the 500,000 character limit." : undefined}
        >
          <textarea
            id="policy-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            readOnly={!canWrite}
            spellCheck={false}
            rows={14}
            placeholder="<h1>Privacy Policy</h1><p>…</p>"
            className={cn(inputClass, "h-auto min-h-48 py-3 font-mono text-[13px] leading-5")}
          />
        </Field>

        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn("text-sm font-medium", notice.tone === "error" ? "text-destructive" : "text-mint")}
          >
            {notice.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="rounded-xl"
            disabled={!canWrite || publishing || !html.trim() || tooLarge || !dirty}
            title={canWrite ? undefined : NO_ACCESS_HINT}
            onClick={publish}
          >
            {publishing ? "Publishing…" : overview?.current ? "Publish new version" : "Publish"}
          </Button>
          {dirty && !publishing && <span className="text-xs text-muted-foreground">Unpublished changes</span>}
        </div>
      </SectionCard>

      {overview?.current && (
        <SectionCard title="Live preview" description="Exactly what visitors see (scripts are disabled in this preview).">
          <iframe
            title={`${app.name} privacy policy preview`}
            sandbox=""
            srcDoc={overview.current.html}
            className="h-[28rem] w-full rounded-xl bg-white shadow-[inset_0_0_0_1px_var(--border)]"
          />
        </SectionCard>
      )}

      {overview && overview.versions.length > 0 && (
        <SectionCard title="Version history" description="Every publish is kept. Load an older one to restore it.">
          <ul className="flex flex-col divide-y divide-border/60">
            {overview.versions.map((v) => (
              <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <HistoryIcon className="size-4 text-muted-foreground" />
                  <span className="font-semibold">v{v.version}</span>
                  <span className="text-muted-foreground">
                    {when(v.publishedAt)}
                    {v.publishedByEmail ? ` · ${v.publishedByEmail}` : ""}
                  </span>
                  {v.version === overview.current?.version && <Pill tone="mint">LIVE</Pill>}
                </span>
                {v.version !== overview.current?.version && (
                  <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => void loadVersion(v)}>
                    Load into editor
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  )
}

function SlugForm({
  app,
  canWrite,
  onChanged,
}: {
  app: BackendApp
  canWrite: boolean
  onChanged: (app: BackendApp) => void
}) {
  const [slug, setSlug] = React.useState(app.slug)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()

  const valid = SLUG_RE.test(slug) && slug.length >= 2
  const changed = slug !== app.slug

  async function save() {
    setSaving(true)
    setError(undefined)
    try {
      onChanged(await billingApi.updateApp(app.id, { slug }))
    } catch (e) {
      setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && changed) void save()
      }}
    >
      <Field
        id="policy-slug"
        label="URL name"
        hint="Lowercase letters, numbers and hyphens. Changing it changes the link."
        error={error ?? (changed && !valid ? "Use 2–40 lowercase letters, numbers or hyphens." : undefined)}
      >
        <TextInput
          id="policy-slug"
          mono
          value={slug}
          disabled={!canWrite}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          className="w-64"
        />
      </Field>
      <Button type="submit" variant="outline" className="mb-[22px] rounded-xl" disabled={!canWrite || saving || !valid || !changed}>
        {saving ? "Saving…" : "Save URL name"}
      </Button>
    </form>
  )
}
