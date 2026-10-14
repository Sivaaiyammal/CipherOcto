import * as React from "react"

import { AuthContext, type AuthStore, type Session } from "@/data/auth-context"

const STORAGE_KEY = "cipherocto.session"

// "Remember me" persists across browser restarts; otherwise the session ends
// with the tab. Storage can be unavailable (private mode), so every access is guarded.
function readSession(): Session | null {
  for (const storage of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const raw = storage().getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Session
    } catch {
      // ignore unavailable storage / malformed value
    }
  }
  return null
}

function clearSession() {
  for (const storage of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      storage().removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(readSession)

  const store = React.useMemo<AuthStore>(
    () => ({
      session,
      signIn: (email, remember) => {
        const next: Session = { email, signedInAt: new Date().toISOString() }
        clearSession()
        try {
          ;(remember ? window.localStorage : window.sessionStorage).setItem(
            STORAGE_KEY,
            JSON.stringify(next)
          )
        } catch {
          // session still works in memory for this tab
        }
        setSession(next)
      },
      signOut: () => {
        clearSession()
        setSession(null)
      },
    }),
    [session]
  )

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
}
