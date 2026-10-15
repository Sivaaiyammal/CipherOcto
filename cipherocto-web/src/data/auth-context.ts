import * as React from "react"

import type { Permission } from "@/lib/permissions"

export type AuthUser = {
  id: string
  email: string
  name: string
  status: "active" | "suspended"
  role: { id: string; label: string }
  permissions: Permission[]
  lastLoginAt: string | null
}

export type DemoConfig = { enabled: boolean; roles: { id: string; label: string }[] }

export type AuthStore = {
  /** "loading" while the session cookie is being checked on first load. */
  status: "loading" | "authenticated" | "anonymous"
  user: AuthUser | null
  demo: DemoConfig
  /** True when the signed-in role holds every listed permission. */
  can: (...permissions: Permission[]) => boolean
  /** Rejects with an ApiError carrying a user-facing message. */
  login: (email: string, password: string, remember: boolean) => Promise<void>
  loginDemo: (roleId: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = React.createContext<AuthStore | null>(null)

export function useAuth() {
  const store = React.useContext(AuthContext)
  if (!store) throw new Error("useAuth must be used inside <AuthProvider>")
  return store
}
