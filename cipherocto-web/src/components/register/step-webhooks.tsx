import * as React from "react"
import { CloudIcon, EyeIcon, EyeOffIcon, RefreshCwIcon, RouteIcon, WebhookIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { CopyBox, Field, Pill, SectionCard, TextInput } from "@/components/register/fields"
import {
  appleNotificationUrl,
  googlePushEndpoint,
  WEBHOOK_EVENTS,
  type Errors,
  type RegisterDraft,
} from "@/data/register"

type Props = {
  draft: RegisterDraft
  setDraft: React.Dispatch<React.SetStateAction<RegisterDraft>>
  errors: Errors
  signingSecret: string
  onRegenerateSecret: () => void
}

export function StepWebhooks({ draft, setDraft, errors, signingSecret, onRegenerateSecret }: Props) {
  const [reveal, setReveal] = React.useState(false)
  const masked = `${signingSecret.slice(0, 10)}${"•".repeat(24)}`

  return (
    <>
      {draft.ios.enabled && (
        <SectionCard
          step="A"
          title="App Store Server Notifications V2"
          description="Apple pushes renewals, refunds and billing retries to this URL in real time."
          aside={<Pill tone="mint">Production &amp; Sandbox</Pill>}
        >
          <CopyBox
            label={
              <>
                <RouteIcon className="size-4 text-mint" />
                Production Server URL
              </>
            }
            value={appleNotificationUrl(draft)}
            help="App Store Connect › your app › App Information › App Store Server Notifications › Version 2."
          />
          <CopyBox
            label={
              <>
                <RouteIcon className="size-4 text-mint" />
                Sandbox Server URL
              </>
            }
            value={`${appleNotificationUrl(draft)}?env=sandbox`}
            help="Use the sandbox URL so TestFlight purchases are tracked separately from live revenue."
          />
        </SectionCard>
      )}

      {draft.android.enabled && (
        <SectionCard
          step="B"
          title="Google Play RTDN (Cloud Pub/Sub)"
          description="Play publishes subscription changes to a Pub/Sub topic; CipherOcto subscribes with a push endpoint."
        >
          <Field
            id="android-topic"
            label="Cloud Pub/Sub RTDN Topic ID"
            required
            error={errors.topic}
            hint="Must match the topic set in Play Console › Monetization setup › Real-time developer notifications."
          >
            <div className="relative">
              <TextInput
                id="android-topic"
                mono
                value={draft.android.topic}
                placeholder="projects/octo-prod/topics/play-rtdn-inbound"
                onChange={(e) => setDraft((d) => ({ ...d, android: { ...d.android, topic: e.target.value.trim() } }))}
                error={errors.topic}
                className="pr-10"
              />
              <CloudIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mint" />
            </div>
          </Field>
          <CopyBox
            label={
              <>
                <CloudIcon className="size-4 text-mint" />
                Push Subscription Endpoint
              </>
            }
            value={googlePushEndpoint(draft)}
            help="Create a push subscription on the topic pointing here, and grant google-play-developer-notifications@system.gserviceaccount.com the Pub/Sub Publisher role."
          />
        </SectionCard>
      )}

      <SectionCard
        step="C"
        title="Outbound Webhooks"
        description="Optional: forward normalized purchase events from both stores to your own backend."
        aside={draft.env.hmac ? <Pill tone="mint">HMAC-SHA256 signed</Pill> : <Pill>Unsigned</Pill>}
      >
        <Field
          id="webhook-url"
          label="Endpoint URL"
          error={errors.webhookUrl}
          hint="Leave empty to skip — you can add endpoints later in Integrations."
        >
          <TextInput
            id="webhook-url"
            type="url"
            mono
            value={draft.webhook.url}
            placeholder="https://api.octocorp.com/v1/webhooks/cipherocto"
            onChange={(e) => setDraft((d) => ({ ...d, webhook: { ...d.webhook, url: e.target.value.trim() } }))}
            error={errors.webhookUrl}
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-[13px] font-semibold text-foreground">Events to forward</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WEBHOOK_EVENTS.map((ev) => {
              const checked = draft.webhook.events.includes(ev.id)
              return (
                <label key={ev.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-background p-3 text-[13px] text-foreground hover:bg-foreground/[0.04]">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        webhook: {
                          ...d.webhook,
                          events: v === true ? [...d.webhook.events, ev.id] : d.webhook.events.filter((e) => e !== ev.id),
                        },
                      }))
                    }
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <span className="min-w-0 flex-1">{ev.label}</span>
                  <code className="hidden font-mono text-[11px] text-muted-foreground lg:inline">{ev.id}</code>
                </label>
              )
            })}
          </div>
        </fieldset>

        {draft.env.hmac && (
          <div className="space-y-1.5 rounded-xl bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <WebhookIcon className="size-4 text-mint" />
                Signing Secret
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  {reveal ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                  {reveal ? "Hide" : "Reveal"}
                </button>
                <button
                  type="button"
                  onClick={onRegenerateSecret}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  <RefreshCwIcon className="size-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-card p-2.5 font-mono text-xs break-all text-foreground shadow-[inset_0_0_0_1px_var(--border)]">
              {reveal ? signingSecret : masked}
            </div>
            <p className="text-xs text-muted-foreground">
              Verify the <code className="font-mono">X-CipherOcto-Signature</code> header with this secret. It is shown once — copy it to your
              backend's secret store.
            </p>
          </div>
        )}
      </SectionCard>
    </>
  )
}
