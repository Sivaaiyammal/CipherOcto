// Team Management & Access Control — mock directory until SSO / IAM is wired up.

export type RoleId = "admin" | "release" | "dev" | "product" | "finance" | "analyst"
export type AppScopeId = "habitocto" | "zenocto" | "focusocto" | "sleepocto"
export type Scope = "all" | AppScopeId[]

export const APP_SCOPES: Record<AppScopeId, string> = {
  habitocto: "HabitOcto Pro",
  zenocto: "ZenOcto Focus",
  focusocto: "FocusOcto",
  sleepocto: "SleepOcto Track",
}

export type Grant = "full" | "view" | "none"

export type Role = {
  id: RoleId
  label: string
  badge: string
  badgeClass: string
  description: string
  grants: Record<string, Grant>
}

export const PERMISSIONS = [
  "Deploy to production",
  "Publish Remote Config",
  "Manage store credentials",
  "View revenue & payouts",
  "Edit paywalls & experiments",
  "Invite & manage members",
  "View audit logs",
] as const

const G = (...v: Grant[]): Record<string, Grant> => Object.fromEntries(PERMISSIONS.map((p, i) => [p, v[i]]))

export const ROLES: Role[] = [
  {
    id: "admin",
    label: "Admin / Organization Owner",
    badge: "High Sensitivity",
    badgeClass: "bg-pink-hover text-pink",
    description: "Full store deploy, financial payouts, user provisioning, CloudHSM root key rollover, and legal agreement execution.",
    grants: G("full", "full", "full", "full", "full", "full", "full"),
  },
  {
    id: "release",
    label: "Release & Config Manager",
    badge: "Production Write",
    badgeClass: "bg-mint-border text-mint",
    description: "Remote Config publish, staged rollouts (0-100%), live feature flag toggles, and StoreKit credentials updates.",
    grants: G("full", "full", "full", "view", "view", "none", "view"),
  },
  {
    id: "dev",
    label: "Developer / Core Engineer",
    badge: "Dev & Staging",
    badgeClass: "bg-blue-hover text-tertiary",
    description: "Live telemetry stream, sandbox debugging, webhook endpoints, and GitHub Actions CI/CD triggers.",
    grants: G("none", "view", "none", "none", "none", "none", "view"),
  },
  {
    id: "product",
    label: "Product & Design",
    badge: "Content Write",
    badgeClass: "bg-lavender-hover text-lavender",
    description: "Paywall copy, store listings and experiment setup. No key, payout or deploy access.",
    grants: G("none", "view", "none", "view", "full", "none", "none"),
  },
  {
    id: "finance",
    label: "Finance Controller",
    badge: "Payout Read",
    badgeClass: "bg-amber-hover text-amber",
    description: "Revenue, payouts, tax packs and invoices across every store. No deploy or config rights.",
    grants: G("none", "none", "none", "full", "none", "none", "view"),
  },
  {
    id: "analyst",
    label: "Analyst / Read-Only Auditor",
    badge: "Read Only",
    badgeClass: "bg-neutral-strong text-muted-foreground",
    description: "Retention cohorts, real-time ARR analytics and paywall experiment reporting (financial transfers masked).",
    grants: G("none", "none", "none", "none", "view", "none", "view"),
  },
]

export type Member = {
  id: string
  name: string
  email: string
  title: string
  roleId: RoleId
  scope: Scope
  auth: string
  /** minutes since last activity; 0 = active now */
  lastMin: number
  keyBound?: boolean
}

type Row = [name: string, title: string, roleId: RoleId, scope: Scope, auth: string, lastMin: number, keyBound?: boolean]

const ALL: Scope = "all"

const ROWS: Row[] = [
  ["Elena Rostova", "Lead Admin & CISO", "admin", ALL, "YubiKey FIDO2 / WebAuthn", 0, true],
  ["Marcus Vance", "Principal iOS Architect", "dev", ["habitocto", "zenocto", "focusocto", "sleepocto"], "Passkey / Touch ID", 18],
  ["Sophia Chen", "Growth & Paywall PM", "product", ALL, "Google SSO + TOTP", 60],
  ["Liam O'Connor", "Senior Android Lead", "dev", ["zenocto", "focusocto"], "WebAuthn / YubiKey", 180],
  ["Priya Patel", "Release & QA Lead", "release", ALL, "Okta SAML + Push", 1_000],
  ["Alex Rivera", "Monetization Specialist", "product", ["habitocto"], "Google SSO", 3_000],
  ["David Kim", "Staff DevOps Engineer", "admin", ALL, "YubiKey FIDO2 / WebAuthn", 25, true],
  ["Chloe Bennett", "Mobile Release Engineer", "release", ["habitocto", "zenocto"], "Okta SAML + Push", 95],
  ["Lucas Wright", "QA Automation Lead", "release", ["habitocto", "focusocto"], "Passkey / Face ID", 240],
  ["Nora Haddad", "Release Manager", "release", ALL, "Okta SAML + Push", 400],
  ["Tomás Herrera", "Backend Engineer", "dev", ["habitocto"], "WebAuthn / YubiKey", 35],
  ["Aisha Khan", "Android Engineer", "dev", ["zenocto"], "Passkey / Touch ID", 70],
  ["Jonas Weber", "iOS Engineer", "dev", ["focusocto"], "Google SSO + TOTP", 130],
  ["Mei Tanaka", "iOS Engineer", "dev", ["habitocto", "sleepocto"], "Passkey / Face ID", 210],
  ["Omar Farouk", "Platform Engineer", "dev", ALL, "WebAuthn / YubiKey", 55],
  ["Hannah Berg", "Android Engineer", "dev", ["sleepocto"], "Google SSO + TOTP", 330],
  ["Ravi Menon", "Data Engineer", "dev", ["habitocto", "zenocto"], "Okta SAML + Push", 520],
  ["Camille Dubois", "Backend Engineer", "dev", ["focusocto"], "Passkey / Touch ID", 760],
  ["Ethan Brooks", "Security Engineer", "dev", ALL, "YubiKey FIDO2 / WebAuthn", 1_300, true],
  ["Isabel Ortega", "Mobile Engineer", "dev", ["zenocto"], "Google SSO + TOTP", 1_900],
  ["Yuki Sato", "Mobile Engineer", "dev", ["sleepocto"], "Passkey / Face ID", 2_400],
  ["Ben Carter", "Frontend Engineer", "dev", ["habitocto"], "Okta SAML + Push", 4_300],
  ["Zara Ahmed", "Product Designer", "product", ["habitocto", "zenocto"], "Google SSO", 150],
  ["Felix Novak", "UX Researcher", "product", ALL, "Google SSO + TOTP", 640],
  ["Grace Lin", "Brand Designer", "product", ["sleepocto"], "Google SSO", 1_700],
  ["Diego Alvarez", "Finance Controller", "finance", ALL, "Okta SAML + Push", 280, true],
  ["Marta Kowalski", "Revenue Accountant", "finance", ALL, "Google SSO + TOTP", 2_200],
  ["Sam Okafor", "Growth Analyst", "analyst", ["habitocto", "zenocto"], "Google SSO", 90],
]

export const SEED_MEMBERS: Member[] = ROWS.map(([name, title, roleId, scope, auth, lastMin, keyBound], i) => ({
  id: `m${i + 1}`,
  name,
  email: `${name.normalize("NFD").toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((p, j) => (j === 0 ? p : p[0])).join(".")}@octocorp.internal`,
  title,
  roleId,
  scope,
  auth,
  lastMin,
  keyBound,
}))

export function lastActiveLabel(min: number) {
  if (min <= 0) return "Active now"
  if (min < 60) return `${min}m ago`
  if (min < 24 * 60) return `${Math.round(min / 60)}h ago`
  if (min < 48 * 60) return "Yesterday"
  return `${Math.round(min / (24 * 60))}d ago`
}

export const roleOf = (id: RoleId) => ROLES.find((r) => r.id === id)!

export function scopeLabel(s: Scope) {
  return s === "all" ? "All 8 Portfolio Apps" : s.map((a) => APP_SCOPES[a]).join(", ")
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export type Invite = { id: string; email: string; roleId: RoleId; scope: Scope; sentMin: number; expiresDays: number }

export const SEED_INVITES: Invite[] = [
  { id: "i1", email: "kai.mueller@octocorp.internal", roleId: "dev", scope: ["focusocto"], sentMin: 60 * 5, expiresDays: 6 },
  { id: "i2", email: "rhea.nair@octocorp.internal", roleId: "product", scope: ["habitocto"], sentMin: 60 * 30, expiresDays: 5 },
  { id: "i3", email: "audit@northgate-llp.com", roleId: "analyst", scope: "all", sentMin: 60 * 52, expiresDays: 4 },
]

export type ServiceAccount = {
  id: string
  name: string
  kind: string
  scope: string
  lastUsedMin: number
  expiresDays: number
  status: "active" | "rotating"
}

export const SEED_SERVICES: ServiceAccount[] = [
  { id: "s1", name: "App Store Connect API key", kind: "Apple · JWT ES256", scope: "All apps", lastUsedMin: 12, expiresDays: 120, status: "active" },
  { id: "s2", name: "Google Play service account", kind: "Google · OAuth2", scope: "All apps", lastUsedMin: 8, expiresDays: 240, status: "active" },
  { id: "s3", name: "StoreKit 2 in-app purchase key", kind: "Apple · .p8", scope: "Subscriptions", lastUsedMin: 3, expiresDays: 300, status: "active" },
  { id: "s4", name: "Stripe restricted key (billing)", kind: "Stripe · rk_live", scope: "Web billing", lastUsedMin: 1, expiresDays: 45, status: "active" },
  { id: "s5", name: "GitHub Actions deploy token", kind: "OIDC · short-lived", scope: "CI/CD", lastUsedMin: 38, expiresDays: 30, status: "active" },
  { id: "s6", name: "Firebase Admin SDK", kind: "GCP · service key", scope: "Crashlytics, FCM", lastUsedMin: 22, expiresDays: 90, status: "active" },
  { id: "s7", name: "AppsFlyer S2S postback", kind: "API token", scope: "Attribution", lastUsedMin: 6, expiresDays: 75, status: "active" },
  { id: "s8", name: "CloudHSM signing authority", kind: "AWS · FIPS 140-3", scope: "Token signing", lastUsedMin: 2, expiresDays: 14, status: "rotating" },
]

export type AuditKind = "access" | "key" | "deploy" | "system"

export type AuditEvent = {
  id: string
  actor: string
  action: string
  target?: string
  meta: string
  ageMin: number
  kind: AuditKind
}

export const KIND_DOT: Record<AuditKind, string> = {
  access: "bg-stream-mrr",
  key: "bg-primary",
  deploy: "bg-tertiary",
  system: "bg-neutral-deep",
}

export const KIND_LABEL: Record<AuditKind, string> = { access: "Access", key: "Keys", deploy: "Deploys", system: "System" }

export const SEED_AUDIT: AuditEvent[] = [
  { id: "a1", actor: "Marcus Vance", action: "generated Staging API key for", target: "HabitOcto Pro v2.9.1", meta: "IP: 192.0.2.44 (VPN-US-EAST)", ageMin: 4, kind: "key" },
  { id: "a2", actor: "Elena Rostova", action: "promoted rollout threshold to", target: "25%", meta: "Hardware 2FA Verified", ageMin: 42, kind: "deploy" },
  { id: "a3", actor: "App Store Connect", action: "service token automatically refreshed", meta: "Automated Daemon Service", ageMin: 120, kind: "system" },
  { id: "a4", actor: "Liam O'Connor", action: "added to deploy channel", target: "ZenOcto", meta: "Authorized by Elena Rostova", ageMin: 300, kind: "access" },
  { id: "a5", actor: "Priya Patel", action: "approved Remote Config publish", target: "build #142", meta: "Hardware 2FA Verified", ageMin: 410, kind: "deploy" },
  { id: "a6", actor: "David Kim", action: "rotated signing key", target: "CloudHSM-02", meta: "IP: 198.51.100.7 (Office-SFO)", ageMin: 700, kind: "key" },
  { id: "a7", actor: "Diego Alvarez", action: "exported payout report for", target: "Oct 2024", meta: "IP: 203.0.113.18", ageMin: 1_500, kind: "access" },
  { id: "a8", actor: "Google Play", action: "RTDN endpoint verified", meta: "Automated Daemon Service", ageMin: 2_100, kind: "system" },
  { id: "a9", actor: "Ethan Brooks", action: "revoked API token for", target: "ex-contractor@vendor.io", meta: "Policy: offboarding", ageMin: 3_000, kind: "access" },
]

export function ageLabel(min: number) {
  if (min < 1) return "just now"
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`
  if (min < 24 * 60) {
    const h = Math.round(min / 60)
    return `${h} hour${h === 1 ? "" : "s"} ago`
  }
  const d = Math.round(min / (24 * 60))
  return `${d} day${d === 1 ? "" : "s"} ago`
}
