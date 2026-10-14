import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/data/auth-context"

/** Sends signed-out visitors to /login and back to where they were afterwards. */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
