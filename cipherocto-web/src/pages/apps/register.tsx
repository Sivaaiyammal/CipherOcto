import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  RocketIcon,
} from "lucide-react"

import {
  ActivationCard,
  CatalogPreview,
  CircuitBreakerCard,
  PreFlightChecklist,
  SetupChecklist,
  StepTip,
} from "@/components/register/register-aside"
import { Pill } from "@/components/register/fields"
import { StepCredentials } from "@/components/register/step-credentials"
import { StepIdentity } from "@/components/register/step-identity"
import { StepVerification } from "@/components/register/step-verification"
import { StepWebhooks } from "@/components/register/step-webhooks"
import { toPortfolioApp } from "@/data/apps"
import { useApps } from "@/data/apps-context"
import { ApiError } from "@/lib/api"
import { billingApi } from "@/lib/billing-api"
import {
  buildCreateAppBody,
  clearDraft,
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  validateStep,
  type Errors,
  type RegisterDraft,
} from "@/data/register"
import { useVerification } from "@/hooks/use-verification"
import { cn } from "@/lib/utils"

const STEPS = [
  { title: "App Identity", sub: "Metadata & storefronts", description: "Name your app, choose storefronts and set bundle identifiers and environment guardrails." },
  { title: "Store Credentials", sub: "API keys & service acct", description: "Link the App Store Connect API key and Google Play service account CipherOcto uses to read purchases." },
  { title: "Webhooks & RTDN", sub: "Pub/Sub & endpoints", description: "Route real-time store notifications to CipherOcto and optionally forward signed events to your backend." },
  { title: "Verification", sub: "First cryptographic ping", description: "Run verification pings against both stores and your webhook before going live." },
] as const

function newSigningSecret() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return `whsec_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
}

function downloadReport(draft: RegisterDraft) {
  const lines = [
    "CipherOcto — App Verification Report",
    `Generated: ${new Date().toISOString()}`,
    "",
    `App: ${draft.name}`,
    `Category: ${draft.category}   Currency: ${draft.currency}   Age rating: ${draft.ageRating}`,
    `Environment: ${draft.env.production ? "Production" : "Sandbox"}`,
    "",
    ...(draft.ios.enabled
      ? ["[Apple App Store]", `Bundle ID: ${draft.ios.bundleId}`, `Apple ID: ${draft.ios.appleId}`, `Key ID: ${draft.ios.keyId}`, ""]
      : []),
    ...(draft.android.enabled
      ? ["[Google Play]", `Package: ${draft.android.packageName}`, `Service account: ${draft.android.serviceAccountEmail}`, `RTDN topic: ${draft.android.topic}`, ""]
      : []),
    `Outbound webhook: ${draft.webhook.url || "none"}`,
    `HMAC signing: ${draft.env.hmac ? "enforced" : "off"}   Circuit breaker: ${draft.env.circuitBreaker ? "on" : "off"}`,
    "",
    "Note: only registration checks (identifier format and uniqueness) were run. Store credential, RTDN and webhook delivery checks run once Google Play is connected.",
  ]
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${(draft.name || "app").toLowerCase().replace(/\W+/g, "-")}-verification.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RegisterAppPage() {
  const navigate = useNavigate()
  const { apps, upsert } = useApps()
  const [draft, setDraft] = React.useState<RegisterDraft>(() => loadDraft() ?? EMPTY_DRAFT)
  const [step, setStep] = React.useState(0)
  const [attempted, setAttempted] = React.useState(false)
  const [savedNote, setSavedNote] = React.useState<string | null>(null)
  const [signingSecret, setSigningSecret] = React.useState(newSigningSecret)
  const [activating, setActivating] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const verification = useVerification(
    draft,
    apps.map((a) => a.bundleId)
  )
  const startedVerification = React.useRef(false)

  // Errors show once the user has tried to continue, and clear live as they fix them
  const errors: Errors = attempted ? validateStep(step, draft) : {}

  React.useEffect(() => {
    if (!savedNote) return
    const t = window.setTimeout(() => setSavedNote(null), 2500)
    return () => window.clearTimeout(t)
  }, [savedNote])

  React.useEffect(() => {
    if (step === 3 && !startedVerification.current) {
      startedVerification.current = true
      verification.run()
    }
  }, [step, verification])

  const goTo = (next: number) => {
    if (next !== 3) startedVerification.current = false
    setStep(next)
    setAttempted(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const onContinue = () => {
    const errs = validateStep(step, draft)
    setAttempted(true)
    if (Object.keys(errs).length) {
      // Wait for the error state to render before focusing the first invalid field
      window.requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>("[aria-invalid='true']")
        first?.focus()
        first?.scrollIntoView({ block: "center", behavior: "smooth" })
      })
      return
    }
    goTo(step + 1)
  }

  const onActivate = async () => {
    setActivating(true)
    setSubmitError(null)
    try {
      const created = await billingApi.createApp(buildCreateAppBody(draft))
      upsert(toPortfolioApp(created))
      clearDraft()
      navigate(`/apps/${created.id}`, { replace: true })
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Couldn't register the app. Check your connection and try again."
      )
      setActivating(false)
    }
  }

  const isFinal = step === 3

  return (
    <>
      {/* Header */}
      <section className="flex flex-col gap-4 px-4 lg:px-6 @3xl/main:flex-row @3xl/main:items-end @3xl/main:justify-between">
        <div className="max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-xs tracking-[0.04em] text-muted-foreground uppercase">
            <Link to="/apps" className="hover:text-foreground">
              Apps
            </Link>
            <ChevronRightIcon className="size-3" />
            <span className="font-semibold text-foreground">New Registration</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">Register New App</h1>
            {isFinal && <Pill tone="mint">FINAL GATE</Pill>}
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{STEPS[step].description}</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl bg-card px-4 py-2 shadow-[var(--shadow-1)] @3xl/main:self-auto">
          <span className="size-2.5 rounded-full bg-stream-mrr motion-safe:animate-pulse" />
          <span className="text-[13px] font-semibold text-foreground">
            Step {step + 1} of {STEPS.length}:
          </span>
          <span className="text-xs font-medium text-muted-foreground">{STEPS[step].title}</span>
        </div>
      </section>

      {/* Stepper */}
      <ol className="grid grid-cols-2 gap-2 px-4 lg:px-6 @3xl/main:grid-cols-4">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={s.title}>
              <button
                type="button"
                disabled={!done}
                onClick={() => goTo(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors",
                  active && "bg-card shadow-[var(--shadow-1)]",
                  done && "bg-background hover:bg-foreground/[0.04]",
                  !active && !done && "bg-foreground/[0.03] opacity-75"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-mint-border text-mint",
                    !active && !done && "bg-neutral-strong text-muted-foreground"
                  )}
                >
                  {done ? <CheckIcon className="size-4" /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-[13px]", active || done ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
                    {s.title}
                  </span>
                  <span className={cn("block truncate text-xs", active ? "font-medium text-mint" : "text-muted-foreground")}>
                    {active ? "In Progress" : done ? "Completed" : s.sub}
                  </span>
                </span>
                {active && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-stream-mrr" />}
              </button>
            </li>
          )
        })}
      </ol>

      {/* Body */}
      <div className="grid grid-cols-1 items-start gap-6 px-4 lg:px-6 @5xl/main:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 @5xl/main:col-span-8">
          {step === 0 && <StepIdentity draft={draft} setDraft={setDraft} errors={errors} />}
          {step === 1 && <StepCredentials draft={draft} setDraft={setDraft} errors={errors} />}
          {step === 2 && (
            <StepWebhooks
              draft={draft}
              setDraft={setDraft}
              errors={errors}
              signingSecret={signingSecret}
              onRegenerateSecret={() => setSigningSecret(newSigningSecret())}
            />
          )}
          {step === 3 && <StepVerification draft={draft} v={verification} />}
          {submitError && (
            <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 @5xl/main:sticky @5xl/main:top-20 @5xl/main:col-span-4">
          {isFinal ? (
            <>
              <ActivationCard
                draft={draft}
                usedSlots={apps.length}
                ready={verification.allPassed}
                activating={activating}
                onActivate={() => void onActivate()}
                onDownloadReport={() => downloadReport(draft)}
              />
              <PreFlightChecklist draft={draft} ready={verification.allPassed} />
              <CircuitBreakerCard enabled={draft.env.circuitBreaker} />
            </>
          ) : (
            <>
              <SetupChecklist draft={draft} registered={apps.length} />
              <CatalogPreview draft={draft} ready={Object.keys(validateStep(0, draft)).length === 0} />
              <StepTip step={step} />
            </>
          )}
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-3 z-20 px-4 lg:px-6">
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-[var(--shadow-3)] backdrop-blur-md sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => (step === 0 ? navigate("/apps") : goTo(step - 1))}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {step === 0 ? "Cancel & Return to Apps" : `Back to Step ${step}: ${STEPS[step - 1].title}`}
          </button>

          <div className="flex items-center justify-end gap-2">
            {savedNote && <span className="hidden text-xs font-medium text-mint sm:inline">{savedNote}</span>}
            <button
              type="button"
              onClick={() => setSavedNote(saveDraft(draft) ? "Draft saved · keys are never stored" : "Couldn't save — browser storage is unavailable")}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-card px-4 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
            >
              <BookmarkIcon className="size-4" />
              {isFinal ? "Save Snapshot" : "Save Draft"}
            </button>
            {isFinal ? (
              <button
                type="button"
                disabled={!verification.allPassed || activating}
                onClick={() => void onActivate()}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-primary-foreground shadow-[var(--shadow-2)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activating ? <Loader2Icon className="size-4 animate-spin" /> : <RocketIcon className="size-4 text-mint-border" />}
                Activate App in Production
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-2)] hover:bg-primary/90"
              >
                Continue to {STEPS[step + 1].title}
                <ArrowRightIcon className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
