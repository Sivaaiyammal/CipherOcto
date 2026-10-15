import { PERMISSIONS, type Permission } from "./permissions.ts"
import type { RoleRecord, RolesRepository } from "./roles.repository.ts"

/** Role and permission lookups. Short-lived cache: roles only change on deploy. */
export class AccessService {
  private readonly roles: RolesRepository
  private cache: { at: number; byId: Map<string, RoleRecord> } | null = null

  constructor(roles: RolesRepository) {
    this.roles = roles
  }

  async syncSystemRoles() {
    await this.roles.syncSystemRoles()
    this.cache = null
  }

  private async all(): Promise<Map<string, RoleRecord>> {
    if (this.cache && Date.now() - this.cache.at < 30_000) return this.cache.byId
    const list = await this.roles.list()
    this.cache = { at: Date.now(), byId: new Map(list.map((r) => [r.id, r])) }
    return this.cache.byId
  }

  async listRoles(): Promise<RoleRecord[]> {
    return [...(await this.all()).values()]
  }

  async roleExists(id: string): Promise<boolean> {
    return (await this.all()).has(id)
  }

  async permissionsFor(roleId: string): Promise<Permission[]> {
    return (await this.all()).get(roleId)?.permissions ?? []
  }

  roleLabel(roleId: string, roles?: Map<string, RoleRecord>): string {
    return roles?.get(roleId)?.label ?? roleId
  }

  async labels(): Promise<Map<string, RoleRecord>> {
    return this.all()
  }

  catalog() {
    return Object.entries(PERMISSIONS).map(([id, description]) => ({ id, description }))
  }
}
