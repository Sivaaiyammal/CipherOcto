/**
 * Single source of truth for RBAC.
 *
 * A permission is `<area>:<action>`. Roles are bundles of permissions. The API
 * enforces them on every route; the web app mirrors the same strings to hide
 * navigation and disable actions (UX only — the server is the real gate).
 *
 * Salary and payout data are deliberately *not* implied by any engineering role:
 * `finance:read` must be granted explicitly (see SKILL.md §4F).
 */

export const PERMISSIONS = {
  "dashboard:read": "View the dashboard",
  "apps:read": "View apps and portfolio",
  "apps:write": "Register and edit apps",
  "config:read": "View remote configuration",
  "config:publish": "Publish remote configuration",
  "subscriptions:read": "View products and paywalls",
  "subscriptions:write": "Create and edit products and paywalls",
  "finance:read": "View revenue, payouts and tax documents",
  "analytics:read": "View analytics and cohorts",
  "projects:read": "View projects and tasks",
  "projects:write": "Create and edit tasks",
  "releases:read": "View releases and rollouts",
  "releases:publish": "Promote, pause and halt rollouts",
  "integrations:read": "View integrations and webhooks",
  "integrations:manage": "Connect integrations, webhooks and API keys",
  "team:read": "View team members and roles",
  "team:manage": "Invite, edit and remove members",
  "audit:read": "View the security audit log",
  "settings:manage": "Change workspace settings",
} as const

export type Permission = keyof typeof PERMISSIONS

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]

export type RoleId = "admin" | "release" | "dev" | "product" | "finance" | "analyst"

export type RoleDefinition = {
  id: RoleId
  label: string
  description: string
  permissions: Permission[]
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "admin",
    label: "Admin / Organization Owner",
    description: "Full access: deploys, payouts, user provisioning, keys and settings.",
    permissions: ALL_PERMISSIONS,
  },
  {
    id: "release",
    label: "Release & Config Manager",
    description: "Publishes remote config and promotes rollouts.",
    permissions: [
      "dashboard:read", "apps:read", "config:read", "config:publish", "subscriptions:read",
      "analytics:read", "projects:read", "projects:write", "releases:read", "releases:publish",
      "integrations:read", "team:read",
    ],
  },
  {
    id: "dev",
    label: "Developer / Core Engineer",
    description: "Builds and debugs apps, webhooks and integrations in dev and staging.",
    permissions: [
      "dashboard:read", "apps:read", "apps:write", "config:read", "analytics:read",
      "projects:read", "projects:write", "releases:read", "integrations:read",
      "integrations:manage", "team:read",
    ],
  },
  {
    id: "product",
    label: "Product & Design",
    description: "Owns paywalls, experiments and store listings. No keys, payouts or deploys.",
    permissions: [
      "dashboard:read", "apps:read", "config:read", "subscriptions:read", "subscriptions:write",
      "analytics:read", "projects:read", "projects:write", "releases:read", "team:read",
    ],
  },
  {
    id: "finance",
    label: "Finance Controller",
    description: "Revenue, payouts, tax packs and invoices. No deploy or config rights.",
    permissions: ["dashboard:read", "apps:read", "subscriptions:read", "finance:read", "analytics:read", "team:read"],
  },
  {
    id: "analyst",
    label: "Analyst / Read-Only Auditor",
    description: "Read-only analytics and reporting. Financial transfers stay masked.",
    permissions: [
      "dashboard:read", "apps:read", "subscriptions:read", "analytics:read",
      "projects:read", "releases:read", "audit:read",
    ],
  },
]

export const isRoleId = (v: string): v is RoleId => ROLE_DEFINITIONS.some((r) => r.id === v)
