import * as React from "react"
import { FileKey2Icon, KeyRoundIcon, LockIcon, PlayIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react"

import { Field, FileDrop, PlatformCard, SectionCard, TextInput } from "@/components/register/fields"
import type { Errors, RegisterDraft } from "@/data/register"

type Props = {
  draft: RegisterDraft
  setDraft: React.Dispatch<React.SetStateAction<RegisterDraft>>
  errors: Errors
}

const MAX_KEY_BYTES = 64 * 1024

export function StepCredentials({ draft, setDraft, errors }: Props) {
  const [p8Error, setP8Error] = React.useState<string | null>(null)
  const [saError, setSaError] = React.useState<string | null>(null)

  // Key files are read locally only to validate their shape; the contents are
  // discarded immediately and never stored or sent anywhere.
  const onP8 = async (file: File) => {
    if (file.size > MAX_KEY_BYTES) return setP8Error("That file is too large to be a .p8 key.")
    const text = await file.text()
    if (!text.includes("-----BEGIN PRIVATE KEY-----")) {
      return setP8Error("This doesn't look like an App Store Connect .p8 private key.")
    }
    setP8Error(null)
    const keyFromName = /AuthKey_([A-Z0-9]{10})\.p8$/i.exec(file.name)?.[1]?.toUpperCase()
    setDraft((d) => ({
      ...d,
      ios: { ...d.ios, p8FileName: file.name, keyId: d.ios.keyId || keyFromName || "" },
    }))
  }

  const onServiceAccount = async (file: File) => {
    if (file.size > MAX_KEY_BYTES) return setSaError("That file is too large to be a service account key.")
    try {
      const json = JSON.parse(await file.text()) as { type?: string; client_email?: string }
      if (json.type !== "service_account" || !json.client_email) {
        return setSaError("Expected a service account key with type \"service_account\" and a client_email.")
      }
      setSaError(null)
      const email = json.client_email
      setDraft((d) => ({
        ...d,
        android: { ...d.android, serviceAccountFile: file.name, serviceAccountEmail: email },
      }))
    } catch {
      setSaError("Couldn't read that file as JSON.")
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl bg-blue-surface p-4 text-[13px] text-foreground">
        <LockIcon className="mt-0.5 size-4 shrink-0 text-tertiary" />
        <p>
          Key files are checked in your browser and are <strong>not stored in this draft</strong>. Until the
          CipherOcto backend is connected they are not uploaded anywhere — you'll re-attach them if you reload.
        </p>
      </div>

      {draft.ios.enabled && (
        <SectionCard step="A" title="App Store Connect API" description="Lets CipherOcto read subscriptions, sales and the App Store Server API for this app.">
          <PlatformCard
            icon={<SmartphoneIcon />}
            iconClass="bg-primary text-primary-foreground"
            title="In-App Purchase API Key"
            subtitle={`${draft.ios.bundleId || "No bundle ID"} • Apple ID ${draft.ios.appleId || "—"}`}
            enabled
            statusLabel={draft.ios.p8FileName ? "Key attached" : "Awaiting key"}
          >
            <Field id="ios-key-id" label="Key ID" required error={errors.keyId} hint="10 characters, shown next to the key in App Store Connect.">
              <TextInput
                id="ios-key-id"
                mono
                value={draft.ios.keyId}
                placeholder="9X284LQ7ZA"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, ios: { ...d.ios, keyId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) } }))
                }
                error={errors.keyId}
              />
            </Field>
            <Field id="ios-issuer" label="Issuer ID" required error={errors.issuerId} hint="Users and Access › Integrations › Keys.">
              <TextInput
                id="ios-issuer"
                mono
                value={draft.ios.issuerId}
                placeholder="57246542-96fe-1a63-e053-0824d011072a"
                onChange={(e) => setDraft((d) => ({ ...d, ios: { ...d.ios, issuerId: e.target.value.trim() } }))}
                error={errors.issuerId}
              />
            </Field>
            <div className="md:col-span-2">
              <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Private Key (.p8) <span className="text-destructive">*</span>
              </span>
              <FileDrop
                id="ios-p8"
                accept=".p8"
                icon={<FileKey2Icon />}
                title={draft.ios.p8FileName ?? "No key attached"}
                detail={draft.ios.p8FileName ? "Validated ES256 private key format" : "Download from App Store Connect — it can only be downloaded once."}
                buttonLabel={draft.ios.p8FileName ? "Replace .p8" : "Upload .p8"}
                error={p8Error ?? errors.p8}
                onFile={onP8}
              />
            </div>
          </PlatformCard>
        </SectionCard>
      )}

      {draft.android.enabled && (
        <SectionCard step="B" title="Google Play Developer API" description="A service account with access to this app in Play Console.">
          <PlatformCard
            icon={<PlayIcon />}
            iconClass="bg-stream-mrr text-white"
            title="Service Account Credential"
            subtitle={draft.android.packageName || "No package name"}
            enabled
            statusLabel={draft.android.serviceAccountEmail ? "Validated" : "Awaiting JSON"}
          >
            <div className="md:col-span-2">
              <FileDrop
                id="android-sa"
                accept="application/json,.json"
                icon={<KeyRoundIcon />}
                title={draft.android.serviceAccountFile ?? "No service account attached"}
                detail={
                  draft.android.serviceAccountEmail
                    ? `Validated: client_email = ${draft.android.serviceAccountEmail}`
                    : "Google Cloud › IAM › Service Accounts › Keys › Add key (JSON)."
                }
                buttonLabel={draft.android.serviceAccountFile ? "Upload New JSON" : "Upload JSON"}
                error={saError ?? errors.serviceAccount}
                onFile={onServiceAccount}
              />
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground md:col-span-2">
              <li className="flex items-center gap-2">
                <ShieldCheckIcon className="size-3.5 text-mint" />
                Grant the account <strong className="text-foreground">View financial data</strong> and{" "}
                <strong className="text-foreground">Manage orders and subscriptions</strong> in Play Console › Users &amp; permissions.
              </li>
            </ul>
          </PlatformCard>
        </SectionCard>
      )}
    </>
  )
}
