import * as React from "react"
import { BadgeCheckIcon, ImageUpIcon, PlayIcon, RouteIcon, SmartphoneIcon } from "lucide-react"

import {
  CopyBox,
  Field,
  Pill,
  PlatformCard,
  SectionCard,
  SelectInput,
  TextInput,
  ToggleRow,
} from "@/components/register/fields"
import {
  AGE_RATINGS,
  appleNotificationUrl,
  CATEGORIES,
  NAME_MAX,
  REPORTING_CURRENCIES,
  type Errors,
  type RegisterDraft,
} from "@/data/register"
import { APP_TONE_TILE } from "@/data/apps"
import { cn } from "@/lib/utils"

const MAX_ICON_BYTES = 4 * 1024 * 1024

type Props = {
  draft: RegisterDraft
  setDraft: React.Dispatch<React.SetStateAction<RegisterDraft>>
  errors: Errors
}

export function StepIdentity({ draft, setDraft, errors }: Props) {
  const [iconError, setIconError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const category = CATEGORIES.find((c) => c.value === draft.category) ?? CATEGORIES[0]
  const CategoryIcon = category.icon

  const onIcon = (file: File) => {
    if (!/^image\/(png|webp|svg\+xml|jpeg)$/.test(file.type)) {
      setIconError("Use a PNG, WEBP, JPG or SVG image.")
      return
    }
    if (file.size > MAX_ICON_BYTES) {
      setIconError("Icons must be 4 MB or smaller.")
      return
    }
    setIconError(null)
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, iconDataUrl: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  return (
    <>
      <SectionCard
        step={1}
        title="Basic App Details"
        description="General metadata displayed in the CipherOcto management hub."
        aside={<Pill>Required</Pill>}
      >
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="flex flex-col items-center sm:col-span-4 sm:items-start">
            <span className="mb-2 text-[13px] font-semibold text-foreground">Application Icon</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload application icon"
              className={cn(
                "group relative flex size-24 items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)] [&>svg]:size-10",
                !draft.iconDataUrl && APP_TONE_TILE[category.tone]
              )}
            >
              {draft.iconDataUrl ? (
                <img src={draft.iconDataUrl} alt="" className="size-full object-cover" />
              ) : (
                <CategoryIcon />
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-primary/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ImageUpIcon className="size-5" />
                <span className="mt-0.5 text-[11px] font-semibold">{draft.iconDataUrl ? "Replace" : "Upload"}</span>
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onIcon(f)
                e.target.value = ""
              }}
            />
          </div>
          <div
            className="space-y-1 rounded-xl bg-background p-4 sm:col-span-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) onIcon(f)
            }}
          >
            <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <BadgeCheckIcon className="size-4 text-mint" />
              1024 × 1024px Asset Recommended
            </p>
            <p className="text-xs text-muted-foreground">
              High-res PNG, WEBP, JPG or SVG (max 4 MB). Shown across revenue telemetry, sandbox testers and cohort analytics.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-8 rounded-lg bg-card px-3 text-[13px] font-semibold shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
              >
                Browse Local File
              </button>
              <span className="text-xs text-muted-foreground">or drop a file here</span>
            </div>
            {iconError && <p className="text-xs font-medium text-destructive">{iconError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field id="app-name" label="Application Display Name" required error={errors.name} className="md:col-span-2">
            <div className="relative">
              <TextInput
                id="app-name"
                value={draft.name}
                maxLength={NAME_MAX}
                placeholder="e.g., FocusOcto — Deep Work Productivity Timer"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                error={errors.name}
                className="pr-14"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums">
                {draft.name.length}/{NAME_MAX}
              </span>
            </div>
          </Field>
          <Field id="app-category" label="Primary Category" required>
            <SelectInput
              id="app-category"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              options={CATEGORIES.map((c) => ({ value: c.value }))}
            />
          </Field>
          <Field id="app-currency" label="Reporting Currency" required>
            <SelectInput
              id="app-currency"
              value={draft.currency}
              onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
              options={REPORTING_CURRENCIES}
            />
          </Field>
          <div className="md:col-span-2">
            <span className="mb-2 block text-[13px] font-semibold text-foreground">Age Rating &amp; Store Classification</span>
            <div role="radiogroup" aria-label="Age rating" className="flex flex-wrap items-center gap-2">
              {AGE_RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={draft.ageRating === r}
                  onClick={() => setDraft((d) => ({ ...d, ageRating: r }))}
                  className={cn(
                    "h-9 rounded-xl px-4 text-[13px] font-semibold transition-colors",
                    draft.ageRating === r
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-1)]"
                      : "bg-background text-foreground hover:bg-foreground/[0.06]"
                  )}
                >
                  {r}
                </button>
              ))}
              <span className="text-xs text-muted-foreground sm:ml-2">
                Synced with App Store Connect and Play Console guidelines.
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        title="Store Platform Selection & Identifiers"
        description="Enable storefronts to track dual-platform entitlements and subscriptions."
        aside={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", draft.ios.enabled && draft.android.enabled ? "bg-mint-border" : "bg-neutral-deep")} />
            {draft.ios.enabled && draft.android.enabled ? "Dual Multi-Store Enabled" : "Single storefront"}
          </span>
        }
      >
        {errors.platforms && <p className="-mt-2 text-xs font-medium text-destructive">{errors.platforms}</p>}
        <div className="flex flex-col gap-4">
          <PlatformCard
            icon={<SmartphoneIcon />}
            iconClass="bg-primary text-primary-foreground"
            title="Apple App Store"
            subtitle="StoreKit 2 & App Store Server Notifications V2"
            enabled={draft.ios.enabled}
            onEnabledChange={(v) => setDraft((d) => ({ ...d, ios: { ...d.ios, enabled: v } }))}
            statusLabel="Enabled"
          >
            <Field id="ios-bundle" label="iOS Bundle Identifier" required error={errors.bundleId} hint="Exact identifier from your Xcode project settings.">
              <TextInput
                id="ios-bundle"
                mono
                value={draft.ios.bundleId}
                placeholder="com.octocorp.focusocto"
                onChange={(e) => setDraft((d) => ({ ...d, ios: { ...d.ios, bundleId: e.target.value.trim() } }))}
                error={errors.bundleId}
              />
            </Field>
            <Field id="ios-apple-id" label="Apple App ID (Numeric)" required error={errors.appleId} hint="App Store Connect › App Information › Apple ID.">
              <TextInput
                id="ios-apple-id"
                mono
                inputMode="numeric"
                value={draft.ios.appleId}
                placeholder="6473829104"
                onChange={(e) => setDraft((d) => ({ ...d, ios: { ...d.ios, appleId: e.target.value.replace(/\D/g, "").slice(0, 10) } }))}
                error={errors.appleId}
              />
            </Field>
            <div className="md:col-span-2">
              <CopyBox
                label={
                  <>
                    <RouteIcon className="size-4 text-mint" />
                    In-App Purchase Server Notifications V2 URL
                  </>
                }
                value={appleNotificationUrl(draft)}
                help="Paste into App Store Connect › App Information › Production Server URL."
              />
            </div>
          </PlatformCard>

          <PlatformCard
            icon={<PlayIcon />}
            iconClass="bg-stream-mrr text-white"
            title="Google Play Console"
            subtitle="Google Play Developer API & Real-time Developer Notifications (RTDN)"
            enabled={draft.android.enabled}
            onEnabledChange={(v) => setDraft((d) => ({ ...d, android: { ...d.android, enabled: v } }))}
            statusLabel="Enabled"
          >
            <Field id="android-package" label="Android Package Name" required error={errors.packageName} className="md:col-span-2" hint="The applicationId from your app's build.gradle.">
              <TextInput
                id="android-package"
                mono
                value={draft.android.packageName}
                placeholder="com.octocorp.focusocto.android"
                onChange={(e) => setDraft((d) => ({ ...d, android: { ...d.android, packageName: e.target.value.trim() } }))}
                error={errors.packageName}
              />
            </Field>
          </PlatformCard>
        </div>
      </SectionCard>

      <SectionCard step={3} title="Telemetry & Environment Toggles" description="Configure verification guardrails and crash-threshold automation.">
        <div className="flex flex-col gap-2">
          <ToggleRow
            id="env-production"
            title="Environment Mode"
            badge={<Pill>{draft.env.production ? "Immediate Production" : "Sandbox Only"}</Pill>}
            description="When enabled, real transactions and cohort telemetry link to Octo Corp Org financial books on activation."
            checked={draft.env.production}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, env: { ...d.env, production: v } }))}
          />
          <ToggleRow
            id="env-hmac"
            title="HMAC-SHA256 Webhook Signature Enforcement"
            badge={<Pill tone="mint">High Security</Pill>}
            description="Rejects unsigned inbound and outbound transaction events to prevent spoofed purchase tokens."
            checked={draft.env.hmac}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, env: { ...d.env, hmac: v } }))}
          />
          <ToggleRow
            id="env-breaker"
            title="Automated Rollout Circuit Breaker"
            badge={<Pill tone="mint">Recommended</Pill>}
            description="Freezes staged releases on both stores if crash rate exceeds 0.25% in the first 2 hours."
            checked={draft.env.circuitBreaker}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, env: { ...d.env, circuitBreaker: v } }))}
          />
        </div>
      </SectionCard>
    </>
  )
}
