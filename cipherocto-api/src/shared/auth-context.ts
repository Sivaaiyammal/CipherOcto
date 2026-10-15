import type { Permission } from "../modules/access/permissions.ts"
import type { UserRecord } from "../modules/users/users.repository.ts"

/** Who is making this request and what they may do. Built once per request. */
export type AuthContext = {
  user: UserRecord
  permissions: ReadonlySet<Permission>
  sessionId: string
}
