// Permission ids mirror cipherocto-api/src/permissions.ts. The server is the real
// gate; the app only uses these to hide navigation and disable controls.

export type Permission =
  | "dashboard:read"
  | "apps:read"
  | "apps:write"
  | "config:read"
  | "config:publish"
  | "subscriptions:read"
  | "subscriptions:write"
  | "finance:read"
  | "analytics:read"
  | "projects:read"
  | "projects:write"
  | "releases:read"
  | "releases:publish"
  | "integrations:read"
  | "integrations:manage"
  | "team:read"
  | "team:manage"
  | "audit:read"
  | "settings:manage"

export const NO_ACCESS_HINT = "Your role doesn't allow this."
