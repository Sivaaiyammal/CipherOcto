import * as React from "react"

export type Session = {
  email: string
  signedInAt: string
}

export type AuthStore = {
  session: Session | null
  /** Mock sign-in until the auth service exists; any valid email/password works. */
  signIn: (email: string, remember: boolean) => void
  signOut: () => void
}

export const AuthContext = React.createContext<AuthStore | null>(null)

export function useAuth() {
  const store = React.useContext(AuthContext)
  if (!store) throw new Error("useAuth must be used inside <AuthProvider>")
  return store
}
