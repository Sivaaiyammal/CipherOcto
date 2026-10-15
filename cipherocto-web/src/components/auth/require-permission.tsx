import { Outlet } from "react-router-dom"

import { useAuth } from "@/data/auth-context"
import ForbiddenPage from "@/pages/forbidden"
import type { Permission } from "@/lib/permissions"

/** Route guard: renders the child route only when the role holds the permission. */
export function RequirePermission({ permission }: { permission: Permission | Permission[] }) {
  const { can } = useAuth()
  const needed = Array.isArray(permission) ? permission : [permission]
  return can(...needed) ? <Outlet /> : <ForbiddenPage />
}
