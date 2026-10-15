import { conflict, forbidden, notFound, badRequest } from "../../shared/errors.ts"
import { hashPassword } from "../../shared/crypto.ts"
import type { AuthContext } from "../../shared/auth-context.ts"
import type { AccessService } from "../access/access.service.ts"
import type { AuditService } from "../audit/audit.service.ts"
import type { UserRecord, UsersRepository, UserStatus } from "./users.repository.ts"
import type { UserView } from "./users.schemas.ts"

/** The part of the sessions store this module needs; the auth module provides it. */
export type SessionRevoker = {
  revokeAllForUser(userId: string): Promise<void>
}

export class UsersService {
  private readonly users: UsersRepository
  private readonly access: AccessService
  private readonly audit: AuditService
  private readonly sessions: SessionRevoker

  constructor(deps: { users: UsersRepository; access: AccessService; audit: AuditService; sessions: SessionRevoker }) {
    this.users = deps.users
    this.access = deps.access
    this.audit = deps.audit
    this.sessions = deps.sessions
  }

  async view(user: UserRecord): Promise<UserView> {
    const roles = await this.access.labels()
    return this.toView(user, roles.get(user.roleId)?.label ?? user.roleId)
  }

  private toView(user: UserRecord, roleLabel: string): UserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: { id: user.roleId, label: roleLabel },
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }
  }

  async list(): Promise<UserView[]> {
    const [members, roles] = await Promise.all([this.users.listMembers(), this.access.labels()])
    return members.map((u) => this.toView(u, roles.get(u.roleId)?.label ?? u.roleId))
  }

  /** Nobody can hand out more access than they hold themselves. */
  private async assertCanGrant(actor: AuthContext, roleId: string) {
    if (!(await this.access.roleExists(roleId))) throw badRequest("validation_error", "Unknown role.")
    const wanted = await this.access.permissionsFor(roleId)
    if (!wanted.every((p) => actor.permissions.has(p))) {
      throw forbidden("You can't grant a role with more access than your own.")
    }
  }

  async create(actor: AuthContext, input: { email: string; name: string; roleId: string; password: string }, ip: string) {
    await this.assertCanGrant(actor, input.roleId)
    if (await this.users.byEmail(input.email)) throw conflict("email_taken", "A user with that email already exists.")

    const user = await this.users.create({
      email: input.email,
      name: input.name,
      roleId: input.roleId,
      passwordHash: await hashPassword(input.password),
    })
    await this.audit.record({ actorId: actor.user.id, actorEmail: actor.user.email, action: "user.created", target: user.email, ip, detail: { roleId: user.roleId } })
    return this.view(user)
  }

  async update(
    actor: AuthContext,
    id: string,
    patch: { name?: string; roleId?: string; status?: UserStatus },
    ip: string
  ) {
    const target = await this.users.byId(id)
    if (!target || target.isDemo) throw notFound("User not found.")

    const changesAccess = patch.roleId !== undefined || patch.status !== undefined
    if (changesAccess && target.id === actor.user.id) {
      throw conflict("self_change", "You can't change your own role or status.")
    }
    if (patch.roleId !== undefined) await this.assertCanGrant(actor, patch.roleId)

    // Keep at least one active admin so the workspace can't lock itself out.
    const losesAdmin =
      target.roleId === "admin" &&
      target.status === "active" &&
      ((patch.roleId !== undefined && patch.roleId !== "admin") || patch.status === "suspended")
    if (losesAdmin && (await this.users.countActiveAdmins()) <= 1) {
      throw conflict("last_admin", "At least one active admin is required.")
    }

    await this.users.update(target.id, patch)
    if (patch.status === "suspended" || (patch.roleId !== undefined && patch.roleId !== target.roleId)) {
      // Role and status changes apply immediately, not at next login.
      await this.sessions.revokeAllForUser(target.id)
    }
    await this.audit.record({
      actorId: actor.user.id,
      actorEmail: actor.user.email,
      action: "user.updated",
      target: target.email,
      ip,
      detail: { from: { roleId: target.roleId, status: target.status }, to: patch },
    })
    return this.view((await this.users.byId(target.id))!)
  }
}
