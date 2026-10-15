// Public URL segments for apps (`/<slug>/privacy`). They share one namespace with the
// dashboard's own paths and the API, so those names are reserved.

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

const RESERVED = new Set([
  "api", "admin", "login", "logout", "apps", "app", "billing", "settings", "subscriptions",
  "finance", "analytics", "projects", "team", "releases", "integrations", "remote-config",
  "forbidden", "privacy", "terms", "docs", "health", "static", "assets", "public", "new",
  "index", "favicon", "robots", "sitemap", "well-known", "cipherocto",
])

export const isReservedSlug = (slug: string) => RESERVED.has(slug)

/** A candidate slug from an app name, falling back to the last package segment. */
export function slugBase(name?: string, packageName?: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "")
  const fromName = clean(name ?? "")
  if (fromName.length >= 2) return fromName
  const fromPackage = clean((packageName ?? "").split(".").pop() ?? "")
  return fromPackage.length >= 2 ? fromPackage : "app"
}

/** Appends -2, -3, … until the slug is neither taken nor reserved. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  let candidate = base
  for (let n = 2; taken.has(candidate) || isReservedSlug(candidate); n++) {
    const suffix = `-${n}`
    candidate = `${base.slice(0, 40 - suffix.length)}${suffix}`
  }
  return candidate
}
