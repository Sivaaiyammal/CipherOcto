import type { FastifyBaseLogger } from "fastify"

import type { AuditEntry, AuditRecord, AuditRepository } from "./audit.repository.ts"

export class AuditService {
  private readonly repo: AuditRepository
  private readonly log: FastifyBaseLogger | null

  constructor(repo: AuditRepository, log: FastifyBaseLogger | null = null) {
    this.repo = repo
    this.log = log
  }

  /**
   * Records a security-relevant event. An audit write failing must not turn a
   * successful login or role change into an error, but it must be loud.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.append(entry)
    } catch (err) {
      this.log?.error({ err, action: entry.action }, "failed to write audit log entry")
    }
  }

  recent(limit: number): Promise<AuditRecord[]> {
    return this.repo.recent(limit)
  }
}
