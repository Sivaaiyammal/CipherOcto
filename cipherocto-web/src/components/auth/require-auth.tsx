import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2Icon } from "lucide-react"

import { useAuth } from "@/data/auth-context"

/** Sends signed-out visitors to /login and back to where they were afterwards. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  // The session cookie is HttpOnly, so we have to ask the server before deciding.
  if (status === "loading") {
    return (
      <div role="status" aria-label="Checking your session" className="flex min-h-svh items-center justify-center bg-background">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
