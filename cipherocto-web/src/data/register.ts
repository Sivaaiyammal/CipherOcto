// Register New App wizard: draft model, validation and the portfolio record
// it produces. Credentials are never persisted — only file names and the
// non-secret fields parsed from them are kept in the draft.
import {
  GraduationCapIcon,
  HeartPulseIcon,
  ListChecksIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import type { AppTone, Platform, PortfolioApp } from "@/data/apps"

export const CATEGORIES: { value: string; icon: LucideIcon; tone: AppTone }[] = [
  { value: "Productivity", icon: ListChecksIcon, tone: "mint" },
  { value: "Health & Fitness", icon: HeartPulseIcon, tone: "pink" },
  { value: "Finance", icon: WalletIcon, tone: "amber" },
  { value: "Utilities", icon: WrenchIcon, tone: "blue" },
  { value: "Education", icon: GraduationCapIcon, tone: "lavender" },
  { value: "Lifestyle & Social", icon: UsersIcon, tone: "stone" },
]

export const REPORTING_CURRENCIES = [
  { value: "USD", label: "USD ($) — United States Dollar" },
  { value: "EUR", label: "EUR (€) — Euro Area" },
  { value: "GBP", label: "GBP (£) — British Pound" },
  { value: "JPY", label: "JPY (¥) — Japanese Yen" },
  { value: "CAD", label: "CAD ($) — Canadian Dollar" },
]

export const AGE_RATINGS = ["4+ Standard", "9+ Moderate", "12+ Infrequent", "17+ Mature"] as const

export const WEBHOOK_EVENTS = [
  { id: "subscription.renewed", label: "Subscription renewed" },
  { id: "subscription.cancelled", label: "Subscription cancelled" },
  { id: "subscription.billing_issue", label: "Billing issue / grace period" },
  { id: "purchase.refunded", label: "Purchase refunded" },
  { id: "trial.converted", label: "Trial converted" },
] as const

export const NAME_MAX = 64

export type RegisterDraft = {
  name: string
  category: string
  currency: string
  ageRating: (typeof AGE_RATINGS)[number]
  /** In-memory only (data URL); not saved with the draft. */
  iconDataUrl: string | null
  ios: {
    enabled: boolean
    bundleId: string
    appleId: string
    keyId: string
    issuerId: string
    /** File name only — the key itself is never stored. */
    p8FileName: string | null
  }
  android: {
    enabled: boolean
    packageName: string
    serviceAccountFile: string | null
    serviceAccountEmail: string | null
    topic: string
  }
  webhook: {
    url: string
    events: string[]
  }
  env: {
    production: boolean
    hmac: boolean
    circuitBreaker: boolean
  }
}

export const EMPTY_DRAFT: RegisterDraft = {
  name: "",
  category: "Productivity",
  currency: "USD",
  ageRating: "4+ Standard",
  iconDataUrl: null,
  ios: { enabled: true, bundleId: "", appleId: "", keyId: "", issuerId: "", p8FileName: null },
  android: { enabled: true, packageName: "", serviceAccountFile: null, serviceAccountEmail: null, topic: "" },
  webhook: { url: "", events: ["subscription.renewed", "subscription.cancelled", "purchase.refunded"] },
  env: { production: true, hmac: true, circuitBreaker: true },
}

// ── Validation ─────────────────────────────────────────────────────────────

const BUNDLE_RE = /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)+$/
const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/
const APPLE_ID_RE = /^\d{9,10}$/
const KEY_ID_RE = /^[A-Z0-9]{10}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOPIC_RE = /^projects\/[a-z][a-z0-9-]{4,28}[a-z0-9]\/topics\/[A-Za-z][\w.~+%-]{2,254}$/

export type Errors = Record<string, string>

export function validateStep(step: number, d: RegisterDraft): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!d.name.trim()) e.name = "Enter the app's display name."
    else if (d.name.length > NAME_MAX) e.name = `Keep it under ${NAME_MAX} characters.`
    if (!d.ios.enabled && !d.android.enabled) e.platforms = "Enable at least one storefront."
    if (d.ios.enabled) {
      if (!BUNDLE_RE.test(d.ios.bundleId)) e.bundleId = "Use reverse-DNS format, e.g. com.company.app."
      if (!APPLE_ID_RE.test(d.ios.appleId)) e.appleId = "The numeric Apple ID is 9–10 digits."
    }
    if (d.android.enabled && !PACKAGE_RE.test(d.android.packageName)) {
      e.packageName = "Use a valid package name, e.g. com.company.app.android."
    }
  }
  if (step === 1) {
    if (d.ios.enabled) {
      if (!KEY_ID_RE.test(d.ios.keyId)) e.keyId = "Key IDs are 10 uppercase letters or digits."
      if (!UUID_RE.test(d.ios.issuerId)) e.issuerId = "The Issuer ID is a UUID from App Store Connect › Users and Access › Keys."
      if (!d.ios.p8FileName) e.p8 = "Upload the .p8 private key file."
    }
    if (d.android.enabled && !d.android.serviceAccountEmail) {
      e.serviceAccount = "Upload a Google service account JSON key."
    }
  }
  if (step === 2) {
    if (d.android.enabled && !TOPIC_RE.test(d.android.topic)) {
      e.topic = "Format: projects/<project-id>/topics/<topic-name>."
    }
    if (d.webhook.url) {
      try {
        const url = new URL(d.webhook.url)
        if (url.protocol !== "https:") e.webhookUrl = "Webhook endpoints must use HTTPS."
      } catch {
        e.webhookUrl = "Enter a full URL, e.g. https://api.yourco.com/webhooks/cipherocto."
      }
    }
  }
  return e
}

// ── Derived values ─────────────────────────────────────────────────────────

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
}

/** Stable per-app endpoint path segment for store notification URLs. */
export function endpointKey(d: RegisterDraft) {
  const base = d.ios.bundleId || d.android.packageName || d.name || "new-app"
  let h = 0x811c9dc5
  for (let i = 0; i < base.length; i++) h = Math.imul(h ^ base.charCodeAt(i), 0x01000193)
  return `app_${(h >>> 0).toString(16).padStart(8, "0")}`
}

export function appleNotificationUrl(d: RegisterDraft) {
  return `https://api.cipherocto.com/v2/rtdn/apple/${endpointKey(d)}`
}

export function googlePushEndpoint(d: RegisterDraft) {
  return `https://api.cipherocto.com/v2/rtdn/google/${endpointKey(d)}`
}

export function draftPlatforms(d: RegisterDraft): Platform[] {
  return [...(d.ios.enabled ? (["ios"] as const) : []), ...(d.android.enabled ? (["android"] as const) : [])]
}

export function platformSummary(d: RegisterDraft) {
  if (d.ios.enabled && d.android.enabled) return "iOS & Android"
  if (d.ios.enabled) return "iOS"
  if (d.android.enabled) return "Android"
  return "No storefront"
}

/** Builds the portfolio record created on activation (no telemetry yet). */
export function buildPortfolioApp(d: RegisterDraft, existingIds: string[]): PortfolioApp {
  const category = CATEGORIES.find((c) => c.value === d.category) ?? CATEGORIES[0]
  let id = slugify(d.name) || "new-app"
  for (let n = 2; existingIds.includes(id); n++) id = `${slugify(d.name) || "new-app"}-${n}`

  return {
    id,
    name: d.name.trim(),
    bundleId: d.ios.enabled ? d.ios.bundleId : d.android.packageName,
    version: "1.0.0",
    build: 1,
    category: category.value,
    platforms: draftPlatforms(d),
    status: { kind: d.env.production ? "live" : "review" },
    icon: category.icon,
    tone: category.tone,
    installs30d: 0,
    revenueMonthly: 0,
    revenueGrowth: 0,
    subscribers: 0,
    mau: 0,
    crashFree: 100,
    crashNote: "No sessions yet",
    rating: 0,
    ratingCount: 0,
    integrations: [
      ...(d.ios.enabled ? ["StoreKit 2"] : []),
      ...(d.android.enabled ? ["Play RTDN"] : []),
      ...(d.webhook.url ? ["Webhooks"] : []),
    ],
    configFlags: 0,
    recentlyReleased: true,
  }
}

// ── Draft persistence (non-secret fields only) ─────────────────────────────

const DRAFT_KEY = "cipherocto.registerDraft"

export function saveDraft(d: RegisterDraft) {
  // Icons and credential files stay in memory; only identifiers are saved.
  const safe: RegisterDraft = {
    ...d,
    iconDataUrl: null,
    ios: { ...d.ios, p8FileName: null },
    android: { ...d.android, serviceAccountFile: null, serviceAccountEmail: null },
  }
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(safe))
    return true
  } catch {
    return false
  }
}

export function loadDraft(): RegisterDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RegisterDraft>
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      ios: { ...EMPTY_DRAFT.ios, ...parsed.ios },
      android: { ...EMPTY_DRAFT.android, ...parsed.android },
      webhook: { ...EMPTY_DRAFT.webhook, ...parsed.webhook },
      env: { ...EMPTY_DRAFT.env, ...parsed.env },
    }
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}
