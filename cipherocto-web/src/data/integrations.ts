// Integrations & Webhooks — mock connectors until the real provider SDKs are wired up.
// Secrets here are placeholders; real ones must live server-side.

export type Category = "stores" | "telemetry" | "webhooks" | "warehouse"
export type Status = "live" | "streaming" | "paused"
export type IconKey = "phone" | "shop" | "card" | "monitor" | "flame" | "chat" | "bell" | "users" | "snow" | "database" | "layers" | "link"

export const CATEGORY_LABEL: Record<Category, string> = {
  stores: "App Stores & Billing",
  telemetry: "Telemetry & Crash",
  webhooks: "Webhooks & Events",
  warehouse: "Data Warehouses",
}

export type Integration = {
  id: string
  name: string
  subtitle: string
  category: Category
  icon: IconKey
  status: Status
  /** label for the green status chip when active */
  chip: string
  meta: { label: string; value: string; mono?: boolean; tone?: "error" }[]
  healthLine: string
  testLabel: string
  configLabel: string
}

export const SEED_INTEGRATIONS: Integration[] = [
  {
    id: "apple", name: "Apple App Store Connect", subtitle: "StoreKit 2 • Server Notifications V2", category: "stores", icon: "phone", status: "live", chip: "Live Sync",
    meta: [
      { label: "Private Key ID", value: "M8B7X9Q2LA", mono: true },
      { label: "Issuer GUID", value: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6", mono: true },
      { label: "App Bundles Registered", value: "4 active (iOS, iPadOS, macOS)" },
      { label: "Signature Algorithm", value: "ECDSA P-256 (CloudHSM Enclave)" },
    ],
    healthLine: "V2 RTDN Webhook verified (0 errors)", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "google", name: "Google Play Developer API", subtitle: "Billing v6.0 • Cloud Pub/Sub RTDN", category: "stores", icon: "shop", status: "live", chip: "Live Sync",
    meta: [
      { label: "Service Account", value: "octo-rtdn-sa@octo-corp.iam...", mono: true },
      { label: "GCP Pub/Sub Topic", value: "projects/octo-corp/topics/play-billing", mono: true },
      { label: "Packages Tracked", value: "com.cipherocto.pro, .enterprise" },
      { label: "Real-Time Ack Rate", value: "100% (ACK within 120ms)" },
    ],
    healthLine: "Pub/Sub consumer stream active", testLabel: "Audit Perms", configLabel: "Configure",
  },
  {
    id: "stripe", name: "Stripe Billing & Web Bridge", subtitle: "Dual-write cross-platform ledger reconciler", category: "stores", icon: "card", status: "live", chip: "Live Sync",
    meta: [
      { label: "Target Webhook", value: "api.cipherocto.com/v1/wh/stripe", mono: true },
      { label: "Stripe Account", value: "acct_1NZX4vK89100qLMx", mono: true },
      { label: "Reconciled Today", value: "1,420 checkout conversions" },
      { label: "Webhook Signing Secret", value: "whsec_8849bf...12", mono: true },
    ],
    healthLine: "Last transaction: 14s ago", testLabel: "View Logs", configLabel: "Manage Secrets",
  },
  {
    id: "revenuecat", name: "RevenueCat Entitlement Bridge", subtitle: "Cross-store entitlement mirroring", category: "stores", icon: "layers", status: "live", chip: "Live Sync",
    meta: [
      { label: "Project", value: "proj_octo_prod", mono: true },
      { label: "Mirrored Entitlements", value: "pro, team, lifetime" },
      { label: "Sync Mode", value: "Webhook + 5 min poll" },
      { label: "Last Reconcile", value: "3 minutes ago" },
    ],
    healthLine: "Entitlements in sync across 3 stores", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "datadog", name: "Datadog & Sentry Telemetry", subtitle: "Crash regressions, APM traces & symbolication", category: "telemetry", icon: "monitor", status: "streaming", chip: "Streaming",
    meta: [
      { label: "Datadog API Site", value: "datadoghq.com (US1)", mono: true },
      { label: "Auto-Rollback Trigger", value: "Crash-free < 99.5%", tone: "error" },
      { label: "Symbolication Engine", value: "Synced with dSYM & Proguard" },
      { label: "Hourly Telemetry Volume", value: "82,400 APM spans/min" },
    ],
    healthLine: "Circuit breaker armed", testLabel: "Test Trigger", configLabel: "Edit Rule Triggers",
  },
  {
    id: "crashlytics", name: "Firebase Crashlytics", subtitle: "Native crash & non-fatal ingestion", category: "telemetry", icon: "flame", status: "streaming", chip: "Streaming",
    meta: [
      { label: "Project", value: "octo-corp-mobile", mono: true },
      { label: "Apps Linked", value: "8 (iOS + Android)" },
      { label: "Velocity Alerts", value: "Enabled • 0.5% threshold" },
      { label: "BigQuery Export", value: "Daily at 02:00 UTC" },
    ],
    healthLine: "Crash stream healthy", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "amplitude", name: "Amplitude Product Analytics", subtitle: "Behavioral cohorts & funnel events", category: "telemetry", icon: "monitor", status: "streaming", chip: "Streaming",
    meta: [
      { label: "Org", value: "octo-corp", mono: true },
      { label: "Event Volume", value: "21.4M events / day" },
      { label: "Identity Resolution", value: "Device + user_id merge" },
      { label: "Governance", value: "Schema enforced" },
    ],
    healthLine: "Ingestion lag under 4s", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "slack", name: "Slack Release & Incident Bot", subtitle: "Rollout halts, review approvals, crash alerts", category: "webhooks", icon: "chat", status: "live", chip: "Live Sync",
    meta: [
      { label: "Workspace", value: "octo-corp.slack.com", mono: true },
      { label: "Channels", value: "#prod-rollouts, #incidents" },
      { label: "Mentions", value: "On-call group @release-oncall" },
      { label: "Last Message", value: "14 minutes ago" },
    ],
    healthLine: "Bot token valid", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "pagerduty", name: "PagerDuty Escalation", subtitle: "High-severity incident paging", category: "webhooks", icon: "bell", status: "live", chip: "Live Sync",
    meta: [
      { label: "Service", value: "Mobile Production", mono: true },
      { label: "Escalation Policy", value: "Release Managers → CTO" },
      { label: "Severity Mapping", value: "P0/P1 only" },
      { label: "Open Incidents", value: "0" },
    ],
    healthLine: "Integration key verified", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "segment", name: "Segment Customer Data Platform", subtitle: "Identity & lifecycle event fan-out", category: "webhooks", icon: "users", status: "live", chip: "Live Sync",
    meta: [
      { label: "Write Key", value: "wk_6f2b...c91e", mono: true },
      { label: "Destinations", value: "9 enabled" },
      { label: "Events Today", value: "3.1M" },
      { label: "Replay Window", value: "24 hours" },
    ],
    healthLine: "All destinations delivering", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "linear", name: "Linear Issue Sync", subtitle: "Crash clusters → triaged issues", category: "webhooks", icon: "link", status: "paused", chip: "Paused",
    meta: [
      { label: "Team", value: "MOB (Mobile)", mono: true },
      { label: "Auto-create Rule", value: "Crash cluster > 50 users" },
      { label: "Label Set", value: "crash, release-blocker" },
      { label: "Paused By", value: "Priya Patel · 2 days ago" },
    ],
    healthLine: "Paused — no issues are being created", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "snowflake", name: "Snowflake Data Warehouse", subtitle: "Raw telemetry & revenue ledger share", category: "warehouse", icon: "snow", status: "streaming", chip: "Streaming",
    meta: [
      { label: "Account", value: "octo-dw.us-east-1", mono: true },
      { label: "Warehouse", value: "OCTO_INGEST_XS" },
      { label: "Pipe Latency", value: "42ms (batched 500ms)" },
      { label: "Credits (30d)", value: "184" },
    ],
    healthLine: "Snowpipe backlog: 0 files", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "bigquery", name: "Google BigQuery Export", subtitle: "Streaming inserts & scheduled snapshots", category: "warehouse", icon: "database", status: "streaming", chip: "Streaming",
    meta: [
      { label: "Project", value: "octo-corp-analytics", mono: true },
      { label: "Dataset", value: "mobile_events", mono: true },
      { label: "Streaming Quota", value: "38% used" },
      { label: "Schema Drift", value: "None detected" },
    ],
    healthLine: "Streaming inserts healthy", testLabel: "Send Test Ping", configLabel: "Configure",
  },
  {
    id: "redshift", name: "Amazon Redshift Sync", subtitle: "Nightly finance & cohort tables", category: "warehouse", icon: "database", status: "live", chip: "Live Sync",
    meta: [
      { label: "Cluster", value: "octo-rs-prod", mono: true },
      { label: "Schedule", value: "Nightly 03:30 UTC" },
      { label: "Last Run", value: "Succeeded · 6 h ago" },
      { label: "Rows Synced", value: "48.2M" },
    ],
    healthLine: "Last nightly sync succeeded", testLabel: "Send Test Ping", configLabel: "Configure",
  },
]

export type Webhook = {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  sla: string
  latency: string
  paused: boolean
}

export const SEED_WEBHOOKS: Webhook[] = [
  { id: "w1", name: "Prod Event Relay", url: "https://events.octocorp.internal/v2/stream", events: ["subscription.renewed", "refund.created", "entitlement.revoked"], secret: "whsec_99a8b3d41c5e7f1a", sla: "100.0%", latency: "19ms avg • 0 retries", paused: false },
  { id: "w2", name: "Slack Release & Incident Bot", url: "https://hooks.slack.com/services/T00/B01/2984k...", events: ["rollout.halted", "app.review_approved", "crash.spike_alert"], secret: "whsec_33c91a07e2b488de", sla: "99.98%", latency: "31ms avg • 2 retries", paused: false },
  { id: "w3", name: "Customer Data Platform (Segment)", url: "https://api.segment.io/v1/import/octo-bus", events: ["user.churned", "paywall.converted", "user.tier_upgraded"], secret: "whsec_51ae8c6b9d3f10ef", sla: "99.99%", latency: "24ms avg • 0 retries", paused: false },
  { id: "w4", name: "Snowflake Real-Time Ingestion", url: "https://octo-dw.us-east-1.snowflakecomputing.com/pipe", events: ["telemetry.all_raw", "ab_test.exposure"], secret: "whsec_77ff2a18c4d690aa", sla: "100.0%", latency: "42ms avg (Batched 500ms)", paused: false },
]

export const EVENT_TYPES = [
  "subscription.renewed",
  "subscription.cancelled",
  "refund.created",
  "entitlement.granted",
  "entitlement.revoked",
  "rollout.halted",
  "rollout.promoted",
  "app.review_approved",
  "crash.spike_alert",
  "paywall.converted",
  "user.churned",
  "user.tier_upgraded",
  "telemetry.all_raw",
  "ab_test.exposure",
]

export type ApiKey = {
  id: string
  name: string
  env: "Production" | "Sandbox" | "Automations"
  value: string
  scopes: string[]
  used: string
}

export const SEED_KEYS: ApiKey[] = [
  { id: "k1", name: "Production Live Key", env: "Production", value: "octo_live_981a...34df", scopes: ["read:analytics", "write:remote_config", "admin:rollouts"], used: "Used 2 mins ago" },
  { id: "k2", name: "Staging Sandbox Key", env: "Sandbox", value: "octo_test_2109...bc90", scopes: ["read:all", "write:sandbox"], used: "Used 48 mins ago" },
  { id: "k3", name: "CI/CD Fastlane Service Token", env: "Automations", value: "octo_srv_fastlane...18bc", scopes: ["release:publish", "build:upload"], used: "Used Yesterday" },
]

export const SCOPES = [
  "read:analytics",
  "read:all",
  "write:remote_config",
  "write:sandbox",
  "admin:rollouts",
  "release:publish",
  "build:upload",
  "read:entitlements",
]

export type Provider = { id: string; name: string; subtitle: string; category: Category; icon: IconKey; keyLabel: string }

export const CATALOG: Provider[] = [
  { id: "mixpanel", name: "Mixpanel", subtitle: "Product analytics & funnels", category: "telemetry", icon: "monitor", keyLabel: "Project secret" },
  { id: "braze", name: "Braze", subtitle: "Lifecycle messaging & push", category: "webhooks", icon: "bell", keyLabel: "REST API key" },
  { id: "jira", name: "Jira Cloud", subtitle: "Release & incident tickets", category: "webhooks", icon: "link", keyLabel: "API token" },
  { id: "hubspot", name: "HubSpot", subtitle: "Customer CRM sync", category: "webhooks", icon: "users", keyLabel: "Private app token" },
  { id: "databricks", name: "Databricks", subtitle: "Lakehouse ingestion", category: "warehouse", icon: "snow", keyLabel: "Personal access token" },
  { id: "adjust", name: "Adjust", subtitle: "Attribution postbacks", category: "telemetry", icon: "monitor", keyLabel: "S2S token" },
]

export type Delivery = { id: string; event: string; status: number; ms: number; ago: string }

export const deliveriesFor = (seed: number): Delivery[] =>
  ["subscription.renewed", "refund.created", "entitlement.revoked", "paywall.converted", "user.churned"].map((event, i) => ({
    id: `dl_${seed.toString(16)}${i}`,
    event,
    status: i === 3 && seed % 2 ? 503 : 200,
    ms: 14 + ((seed * 7 + i * 13) % 36),
    ago: `${i * 3 + 1}m ago`,
  }))

export const randomHex = (bytes: number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("")
