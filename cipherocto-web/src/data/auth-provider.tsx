import * as React from "react"

import { AuthContext, type AuthStore, type AuthUser, type DemoConfig } from "@/data/auth-context"
import { api, setUnauthorizedHandler } from "@/lib/api"
import type { Permission } from "@/lib/permissions"

const NO_DEMO: DemoConfig = { enabled: false, roles: [] }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [status, setStatus] = React.useState<AuthStore["status"]>("loading")
  const [demo, setDemo] = React.useState<DemoConfig>(NO_DEMO)

  // Who am I? The session lives in an HttpOnly cookie, so the only way to know is to ask.
  React.useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const { user } = await api<{ user: AuthUser }>("/auth/me", { signal: controller.signal, quiet: true })
        setUser(user)
        setStatus("authenticated")
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setUser(null)
        setStatus("anonymous")
      }
    })()
    return () => controller.abort()
  }, [])

  // Offer demo login only when the server says it's enabled.
  React.useEffect(() => {
    const controller = new AbortController()
    api<{ demoLogin: boolean; demoRoles: { id: string; label: string }[] }>("/auth/config", { signal: controller.signal, quiet: true })
      .then((c) => setDemo({ enabled: c.demoLogin, roles: c.demoRoles }))
      .catch(() => setDemo(NO_DEMO))
    return () => controller.abort()
  }, [])

  // Any later 401 (expired, revoked, role changed) ends the session in the UI too.
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus("anonymous")
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const store = React.useMemo<AuthStore>(() => {
    const granted = new Set<Permission>(user?.permissions ?? [])
    const adopt = (next: AuthUser) => {
      setUser(next)
      setStatus("authenticated")
    }
    return {
      status,
      user,
      demo,
      can: (...needed) => needed.every((p) => granted.has(p)),
      login: async (email, password, remember) => {
        const { user } = await api<{ user: AuthUser }>("/auth/login", { method: "POST", body: { email, password, remember }, quiet: true })
        adopt(user)
      },
      loginDemo: async (roleId, remember) => {
        const { user } = await api<{ user: AuthUser }>("/auth/demo", { method: "POST", body: { role: roleId, remember }, quiet: true })
        adopt(user)
      },
      logout: async () => {
        try {
          await api("/auth/logout", { method: "POST", quiet: true })
        } finally {
          // Even if the call failed, drop local state so the UI can't pretend to be signed in.
          setUser(null)
          setStatus("anonymous")
        }
      },
    }
  }, [status, user, demo])

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
}
