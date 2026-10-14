// Remote Configuration: parameter model, seed catalog and helpers.
// In-memory until the config service exists; edits reset on reload.

export type ParamType = "boolean" | "string" | "number" | "json"
export type ParamCategory = "feature" | "paywall" | "experiment" | "killswitch" | "config"
export type Env = "production" | "staging"
export type ClientPlatform = "ios" | "android"

export type Distribution =
  | { kind: "rollout"; pct: number }
  | { kind: "split"; variants: { name: string; pct: number }[] }
  | { kind: "scheduled"; startsAt: string; armsTo: string }
  | { kind: "armed"; scope: string }

export type Condition = { attr: string; op: string; value: string }
export type TargetRule = { name: string; conditions: Condition[]; serve: string; rollout: number; active: boolean }

export type RemoteParam = {
  id: string
  key: string
  type: ParamType
  category: ParamCategory
  tag?: string
  description: string
  value: string
  defaultValue: string
  enabled: boolean
  distribution: Distribution
  chips: string[]
  platforms: ClientPlatform[]
  /** App ids this parameter is scoped to; empty = every app */
  apps: string[]
  rules: TargetRule[]
  updatedBy: string
  updatedAt: string
}

export const CATEGORY_LABEL: Record<ParamCategory, string> = {
  feature: "Feature Flags",
  paywall: "Dynamic Paywalls",
  experiment: "A/B Experiments",
  killswitch: "Kill Switches",
  config: "JSON Configs",
}

export const TYPE_LABEL: Record<ParamType, string> = {
  boolean: "Boolean",
  string: "String",
  number: "Number",
  json: "JSON",
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

/** Next Nov 24, 00:00 UTC (the Black Friday campaign start). */
function nextBlackFriday() {
  const now = new Date()
  let d = new Date(Date.UTC(now.getUTCFullYear(), 10, 24))
  if (d < now) d = new Date(Date.UTC(now.getUTCFullYear() + 1, 10, 24))
  return d.toISOString()
}

const iosAndroid: ClientPlatform[] = ["ios", "android"]

export const SEED_PARAMS: RemoteParam[] = [
  {
    id: "p1", key: "enable_ai_summary", type: "boolean", category: "feature", tag: "Core AI",
    description: "Triggers native generative-AI habit debrief cards.",
    value: "true", defaultValue: "false", enabled: true,
    distribution: { kind: "rollout", pct: 90 }, chips: ["iOS ≥ 17.2", "Android ≥ 14", "Pro Tier"],
    platforms: iosAndroid, apps: ["habitocto", "zenreader"],
    rules: [
      {
        name: "High Value Cohort", active: true, serve: "true", rollout: 90,
        conditions: [
          { attr: "App Version", op: "≥", value: "2.8.4" },
          { attr: "Country Code", op: "IN", value: "US, DE, GB, FR" },
          { attr: "Lifetime Value (LTV)", op: ">", value: "$25.00" },
        ],
      },
    ],
    updatedBy: "Elena Rostova", updatedAt: ago(14),
  },
  {
    id: "p2", key: "paywall_v3_experience", type: "json", category: "paywall", tag: "A/B Active",
    description: "Multi-tier annual subscription pitch with high-discount tier.",
    value: '{"layout": "editorial_pastel", "discount_pct": 20, "annual_sku": "octo_pro_annual_v3"}',
    defaultValue: '{"layout": "classic", "discount_pct": 0}', enabled: true,
    distribution: { kind: "split", variants: [{ name: "A", pct: 50 }, { name: "B", pct: 50 }] },
    chips: ["US, CA, UK, AU", "Cohort < 7d"], platforms: iosAndroid, apps: [],
    rules: [
      {
        name: "New Install Cohort", active: true, serve: "variant_b_annual_offer", rollout: 50,
        conditions: [
          { attr: "Country Code", op: "IN", value: "US, CA, GB, AU" },
          { attr: "Days Since Install", op: "<", value: "7" },
        ],
      },
    ],
    updatedBy: "Marcus Chen", updatedAt: ago(120),
  },
  {
    id: "p3", key: "black_friday_pricing", type: "boolean", category: "feature", tag: "Campaign",
    description: "Bumps the global annual discount to 40% across all storefronts.",
    value: "false", defaultValue: "false", enabled: false,
    distribution: { kind: "scheduled", startsAt: nextBlackFriday(), armsTo: "true" },
    chips: ["All Platforms", "All Locales"], platforms: iosAndroid, apps: [],
    rules: [{ name: "Global Campaign", active: false, serve: "true", rollout: 100, conditions: [{ attr: "Date", op: "≥", value: "Nov 24, 00:00 UTC" }] }],
    updatedBy: "Elena Rostova", updatedAt: ago(60 * 26),
  },
  {
    id: "p4", key: "gemini_flash_fallback_model", type: "string", category: "config", tag: "Infrastructure",
    description: "Edge routing failover model for rapid inference.",
    value: '"gemini-1.5-flash"', defaultValue: '"gpt-4o-mini"', enabled: true,
    distribution: { kind: "rollout", pct: 100 }, chips: ["Client & Gateway", "All Latencies"],
    platforms: iosAndroid, apps: ["zenreader", "habitocto"], rules: [],
    updatedBy: "David K.", updatedAt: ago(60 * 24 * 3),
  },
  {
    id: "p5", key: "legacy_sync_kill_switch", type: "boolean", category: "killswitch", tag: "Safety",
    description: "Instantly isolates GraphQL sync endpoints for builds below v2.1.",
    value: "false", defaultValue: "false", enabled: false,
    distribution: { kind: "armed", scope: "v1.8 – v2.1" }, chips: ["Armed & Ready"],
    platforms: iosAndroid, apps: [],
    rules: [{ name: "Legacy Builds", active: false, serve: "true", rollout: 100, conditions: [{ attr: "App Version", op: "<", value: "2.1.0" }] }],
    updatedBy: "Elena Rostova", updatedAt: ago(60 * 24 * 14),
  },
  {
    id: "p6", key: "onboarding_survey_variant", type: "string", category: "experiment", tag: "Growth",
    description: "First-launch interactive checklist survey vs. single-page modal.",
    value: '"playful_3step"', defaultValue: '"single_modal"', enabled: true,
    distribution: { kind: "split", variants: [{ name: "A", pct: 33 }, { name: "B", pct: 33 }, { name: "C", pct: 34 }] },
    chips: ["First Launch Only"], platforms: iosAndroid, apps: [],
    rules: [{ name: "First Launch", active: true, serve: '"playful_3step"', rollout: 100, conditions: [{ attr: "Session Count", op: "=", value: "1" }] }],
    updatedBy: "Alex Rivera", updatedAt: ago(300),
  },
  {
    id: "p7", key: "haptic_feedback_engine", type: "boolean", category: "feature", tag: "UX",
    description: "Core Haptics patterns for streak and timer milestones.",
    value: "true", defaultValue: "false", enabled: true,
    distribution: { kind: "rollout", pct: 100 }, chips: ["iOS ≥ 16", "Android ≥ 12"],
    platforms: iosAndroid, apps: ["habitocto", "focuspulse", "calorietrack"], rules: [],
    updatedBy: "Marcus Chen", updatedAt: ago(60 * 30),
  },
  {
    id: "p8", key: "streak_freeze_reward_days", type: "number", category: "feature", tag: "Retention",
    description: "Free streak-freeze days granted after a 30-day streak.",
    value: "2", defaultValue: "1", enabled: true,
    distribution: { kind: "rollout", pct: 100 }, chips: ["Streak ≥ 30d"],
    platforms: iosAndroid, apps: ["habitocto"],
    rules: [{ name: "Loyal Users", active: true, serve: "2", rollout: 100, conditions: [{ attr: "Current Streak", op: "≥", value: "30 days" }] }],
    updatedBy: "Alex Rivera", updatedAt: ago(60 * 48),
  },
  {
    id: "p9", key: "annual_offer_discount_pct", type: "number", category: "paywall", tag: "Pricing",
    description: "Annual plan discount shown on the upgrade sheet.",
    value: "30", defaultValue: "20", enabled: true,
    distribution: { kind: "rollout", pct: 50 }, chips: ["Free Tier", "Trial Ended"],
    platforms: iosAndroid, apps: [],
    rules: [{ name: "Lapsed Trials", active: true, serve: "30", rollout: 50, conditions: [{ attr: "Trial Status", op: "=", value: "expired" }] }],
    updatedBy: "Marcus Chen", updatedAt: ago(60 * 6),
  },
  {
    id: "p10", key: "focus_session_max_minutes", type: "number", category: "feature", tag: "Limits",
    description: "Maximum length of a single deep-work session.",
    value: "90", defaultValue: "60", enabled: true,
    distribution: { kind: "rollout", pct: 100 }, chips: ["Pro Tier"],
    platforms: ["ios"], apps: ["focuspulse"], rules: [],
    updatedBy: "David K.", updatedAt: ago(60 * 24 * 5),
  },
  {
    id: "p11", key: "force_update_min_build", type: "string", category: "killswitch", tag: "Safety",
    description: "Blocks launch and prompts an update below this build number.",
    value: '"0"', defaultValue: '"0"', enabled: false,
    distribution: { kind: "armed", scope: "Builds < 120" }, chips: ["Armed & Ready"],
    platforms: iosAndroid, apps: [], rules: [],
    updatedBy: "Elena Rostova", updatedAt: ago(60 * 24 * 21),
  },
  {
    id: "p12", key: "api_rate_limit_override", type: "json", category: "config", tag: "Infrastructure",
    description: "Per-client request budget for the sync gateway.",
    value: '{"rps": 50, "burst": 120}', defaultValue: '{"rps": 20, "burst": 40}', enabled: true,
    distribution: { kind: "rollout", pct: 100 }, chips: ["Gateway"],
    platforms: iosAndroid, apps: [], rules: [],
    updatedBy: "David K.", updatedAt: ago(60 * 24 * 9),
  },
  {
    id: "p13", key: "ai_summary_model_tier", type: "string", category: "experiment", tag: "Core AI",
    description: "Compares standard vs. premium model quality for summaries.",
    value: '"standard"', defaultValue: '"standard"', enabled: true,
    distribution: { kind: "split", variants: [{ name: "Std", pct: 70 }, { name: "Pro", pct: 30 }] },
    chips: ["Pro Tier", "iOS ≥ 17"], platforms: ["ios"], apps: ["zenreader"], rules: [],
    updatedBy: "Elena Rostova", updatedAt: ago(60 * 9),
  },
  {
    id: "p14", key: "maintenance_banner_kill", type: "boolean", category: "killswitch", tag: "Ops",
    description: "Shows a read-only maintenance banner and pauses writes.",
    value: "false", defaultValue: "false", enabled: false,
    distribution: { kind: "armed", scope: "All builds" }, chips: ["Armed & Ready"],
    platforms: iosAndroid, apps: [], rules: [],
    updatedBy: "Marcus Chen", updatedAt: ago(60 * 24 * 40),
  },
  {
    id: "p15", key: "sleep_sound_preload_mb", type: "number", category: "config", tag: "Performance",
    description: "Audio cache budget preloaded on Wi-Fi.",
    value: "25", defaultValue: "10", enabled: true,
    distribution: { kind: "rollout", pct: 75 }, chips: ["Wi-Fi Only", "Android ≥ 13"],
    platforms: ["android"], apps: ["sleepocto"], rules: [],
    updatedBy: "Alex Rivera", updatedAt: ago(60 * 20),
  },
]

/** Staging starts from production with a few in-progress differences. */
export function seedStaging(prod: RemoteParam[]): RemoteParam[] {
  return prod.map((p) => {
    if (p.key === "enable_ai_summary") return { ...p, distribution: { kind: "rollout", pct: 100 } }
    if (p.key === "black_friday_pricing") return { ...p, enabled: true, value: "true" }
    if (p.key === "annual_offer_discount_pct") return { ...p, value: "40" }
    return p
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function servingPct(p: RemoteParam) {
  if (!p.enabled) return 0
  switch (p.distribution.kind) {
    case "rollout":
      return p.distribution.pct
    case "split":
      return 100
    default:
      return 0
  }
}

export function isInFlight(p: RemoteParam) {
  return p.enabled && ((p.distribution.kind === "rollout" && p.distribution.pct < 100) || p.distribution.kind === "split")
}

export function relativeTime(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 14) return `${d} day${d === 1 ? "" : "s"} ago`
  return `${Math.round(d / 7)} weeks ago`
}

/** Rough reach: scoped MAU × rollout × ~70% per extra targeting condition. */
export function estimateReach(rule: TargetRule | undefined, scopedMau: number, totalMau: number) {
  if (!rule) return { devices: Math.round(scopedMau), pctOfMau: totalMau ? scopedMau / totalMau : 0 }
  const selectivity = Math.pow(0.7, Math.max(0, rule.conditions.length - 1))
  const devices = Math.round(scopedMau * selectivity * (rule.rollout / 100))
  return { devices, pctOfMau: totalMau ? devices / totalMau : 0 }
}

export function sdkSnippet(p: Pick<RemoteParam, "key" | "type">, lang: "swift" | "kotlin") {
  const getter = { boolean: "bool", string: "string", number: "number", json: "json" }[p.type]
  if (lang === "swift") {
    return p.type === "boolean"
      ? `let enabled = CipherOcto.shared.bool(forKey: "${p.key}")\nif enabled {\n  // feature on\n}`
      : `let value = CipherOcto.shared.${getter}(forKey: "${p.key}")`
  }
  const kGetter = { boolean: "getBoolean", string: "getString", number: "getNumber", json: "getJson" }[p.type]
  return p.type === "boolean"
    ? `val enabled = CipherOcto.${kGetter}("${p.key}")\nif (enabled) {\n  // feature on\n}`
    : `val value = CipherOcto.${kGetter}("${p.key}")`
}

const comparable = (p: RemoteParam) =>
  JSON.stringify({ v: p.value, e: p.enabled, d: p.distribution, c: p.chips, r: p.rules, pl: p.platforms, a: p.apps, t: p.type })

export type ParamDiff = { key: string; change: "added" | "removed" | "changed"; before?: RemoteParam; after?: RemoteParam }

export function diffParams(before: RemoteParam[], after: RemoteParam[]): ParamDiff[] {
  const out: ParamDiff[] = []
  const prev = new Map(before.map((p) => [p.id, p]))
  const next = new Map(after.map((p) => [p.id, p]))
  for (const p of after) {
    const b = prev.get(p.id)
    if (!b) out.push({ key: p.key, change: "added", after: p })
    else if (comparable(b) !== comparable(p)) out.push({ key: p.key, change: "changed", before: b, after: p })
  }
  for (const p of before) if (!next.has(p.id)) out.push({ key: p.key, change: "removed", before: p })
  return out
}

export function describeValue(p: RemoteParam) {
  const dist =
    p.distribution.kind === "rollout"
      ? `${p.distribution.pct}%`
      : p.distribution.kind === "split"
        ? p.distribution.variants.map((v) => `${v.name} ${v.pct}%`).join(" / ")
        : p.distribution.kind === "scheduled"
          ? "scheduled"
          : "armed"
  return `${p.enabled ? "on" : "off"} · ${p.value} · ${dist}`
}

// ── Validation for the parameter editor ────────────────────────────────────

export const KEY_RE = /^[a-z][a-z0-9_]{2,63}$/

export function validateValue(type: ParamType, raw: string): string | null {
  const v = raw.trim()
  if (!v) return "Enter a value."
  if (type === "boolean" && v !== "true" && v !== "false") return "Use true or false."
  if (type === "number" && !Number.isFinite(Number(v))) return "Enter a number."
  if (type === "json") {
    try {
      const parsed = JSON.parse(v)
      if (typeof parsed !== "object" || parsed === null) return "JSON configs must be an object or array."
    } catch {
      return "That isn't valid JSON."
    }
  }
  return null
}

/** Strings are stored quoted, like they are served to clients. */
export function normalizeValue(type: ParamType, raw: string) {
  const v = raw.trim()
  if (type === "string") return v.startsWith('"') && v.endsWith('"') ? v : JSON.stringify(v)
  if (type === "json") return JSON.stringify(JSON.parse(v)).replace(/,"/g, ', "').replace(/":/g, '": ')
  return v
}

export type AuditEntry = {
  id: string
  build: number
  env: Env
  by: string
  at: string
  summary: string
  /** Snapshot of the environment after this publish (for revert) */
  snapshot: RemoteParam[]
}
