// Thin fetch wrapper for the CipherOcto API.
//
// Auth is a server-set HttpOnly cookie, so the browser attaches it automatically
// and no token ever touches JavaScript. Requests go to same-origin `/api/v1` — Vite
// proxies it in dev, and a Netlify rewrite should do the same in production
// (keeps the cookie first-party).

const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryAfterSeconds?: number

  constructor(status: number, code: string, message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

let onUnauthorized: (() => void) | null = null

/** Lets the auth provider react when any call discovers the session has ended. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  signal?: AbortSignal
  /** Skip the global "session ended" handler (used by the /me bootstrap and login). */
  quiet?: boolean
}

export async function api<T>(path: string, { method = "GET", body, signal, quiet }: Options = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw new ApiError(0, "network_error", "Can't reach the server. Check your connection and try again.")
  }

  if (response.status === 204) return undefined as T

  const data = (await response.json().catch(() => null)) as
    | { error?: string; message?: string; retryAfterSeconds?: number }
    | null

  if (!response.ok) {
    if (response.status === 401 && !quiet) onUnauthorized?.()
    throw new ApiError(
      response.status,
      data?.error ?? "request_failed",
      data?.message ?? `Request failed (${response.status}).`,
      data?.retryAfterSeconds
    )
  }
  return data as T
}
