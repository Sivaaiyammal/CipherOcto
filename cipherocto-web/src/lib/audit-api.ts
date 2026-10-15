// Typed client for the security audit log (`GET /api/v1/admin/audit`, needs audit:read).
import { api } from "@/lib/api"

export type AuditEvent = {
  id: string
  at: string
  actorId: string | null
  actorEmail?: string | null
  action: string
  target: string | null
  ip: string | null
  detail: unknown
}

export const auditApi = {
  recent: (limit = 8, signal?: AbortSignal) =>
    api<{ events: AuditEvent[] }>(`/admin/audit?limit=${limit}`, { signal }).then((r) => r.events),
}
