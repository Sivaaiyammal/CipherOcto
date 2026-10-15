import type { Models } from "../../db/models.ts"
import { ROLE_DEFINITIONS, type Permission } from "./permissions.ts"

export type RoleRecord = {
  id: string
  label: string
  description: string
  permissions: Permission[]
}

type RoleLean = { _id: string; label: string; description: string; permissions: string[] }

export class RolesRepository {
  private readonly model: Models["Role"]

  constructor(models: Models) {
    this.model = models.Role
  }

  /** Makes the roles collection mirror ROLE_DEFINITIONS so code stays the source of truth. */
  async syncSystemRoles(): Promise<void> {
    await this.model.bulkWrite(
      ROLE_DEFINITIONS.map((r) => ({
        replaceOne: {
          filter: { _id: r.id },
          replacement: { _id: r.id, label: r.label, description: r.description, permissions: r.permissions, isSystem: true },
          upsert: true,
        },
      }))
    )
  }

  async list(): Promise<RoleRecord[]> {
    const rows = await this.model.find().lean<RoleLean[]>()
    const order = new Map(ROLE_DEFINITIONS.map((r, i) => [r.id as string, i]))
    return rows
      .map((r) => ({ id: r._id, label: r.label, description: r.description, permissions: [...r.permissions].sort() as Permission[] }))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
  }

  async get(id: string): Promise<RoleRecord | null> {
    const r = await this.model.findById(id).lean<RoleLean | null>()
    return r ? { id: r._id, label: r.label, description: r.description, permissions: r.permissions as Permission[] } : null
  }
}
