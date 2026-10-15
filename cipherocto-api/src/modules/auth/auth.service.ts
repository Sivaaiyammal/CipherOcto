import type { Config } from "../../config.ts"
import { getDummyHash, hashPassword, hashToken, newSessionToken, verifyPassword } from "../../shared/crypto.ts"
import { AppError, badRequest, notFound } from "../../shared/errors.ts"
import type { AuthContext } from "../../shared/auth-context.ts"
import type { AccessService } from "../access/access.service.ts"
import type { AuditService } from "../audit/audit.service.ts"
import type { UsersRepository, UserRecord } from "../users/users.repository.ts"
import type { UsersService } from "../users/users.service.ts"
import type { UserView } from "../users/users.schemas.ts"
import { isRoleId } from "../access/permissions.ts"
import type { SessionsRepository } from "./sessions.repository.ts"
import type { ThrottleRepository } from "./throttle.repository.ts"

export type SessionUser = UserView & { permissions: string[] }

export type Issued = { token: string; ttlMs: number; remember: boolean; user: SessionUser }

type Origin = { ip: string; userAgent: string | null }

const TOUCH_INTERVAL_MS = 60_000

export class AuthService {
  private readonly config: Config
  private readonly users: UsersRepository
  private readonly usersService: UsersService
  private readonly sessions: SessionsRepository
  private readonly throttle: ThrottleRepository
  private readonly access: AccessService
  private readonly audit: AuditService

  constructor(deps: {
    config: Config
    users: UsersRepository
    usersService: UsersService
    sessions: SessionsRepository
    throttle: ThrottleRepository
    access: AccessService
    audit: AuditService
  }) {
    this.config = deps.config
    this.users = deps.users
    this.usersService = deps.usersService
    this.sessions = deps.sessions
    this.throttle = deps.throttle
    this.access = deps.access
    this.audit = deps.audit
  }

  async sessionUser(user: UserRecord): Promise<SessionUser> {
    const [view, permissions] = await Promise.all([this.usersService.view(user), this.access.permissionsFor(user.roleId)])
    return { ...view, permissions: [...permissions].sort() }
  }

  private async issue(user: UserRecord, remember: boolean, origin: Origin): Promise<Issued> {
    const { token, id } = newSessionToken()
    const ttlMs = remember ? this.config.rememberTtlMs : this.config.sessionTtlMs
    await this.sessions.create({
      id,
      userId: user.id,
      remember,
      ip: origin.ip,
      userAgent: origin.userAgent,
      expiresAt: new Date(Date.now() + ttlMs),
    })
    await this.users.markLogin(user.id)
    return { token, ttlMs, remember, user: await this.sessionUser((await this.users.byId(user.id)) ?? user) }
  }

  async login(input: { email: string; password: string; remember: boolean }, origin: Origin): Promise<Issued> {
    const { loginMaxAttempts: max, loginWindowMs: windowMs } = this.config
    // The IP ceiling is looser so one address can't spray many accounts yet shared NATs still work.
    const ipKey = `ip:${origin.ip}`
    const wait = Math.max(await this.throttle.blockedFor(`email:${input.email}`, max), await this.throttle.blockedFor(ipKey, max * 4))
    if (wait > 0) {
      throw new AppError(429, "too_many_attempts", `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, {
        retryAfterSeconds: wait,
      })
    }

    const user = await this.users.byEmail(input.email)
    // Always run a hash so unknown emails cost the same as wrong passwords.
    const valid = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()))

    // Demo accounts have random, discarded passwords; they can never sign in this way.
    if (!user || !valid || user.isDemo) {
      await Promise.all([this.throttle.fail(`email:${input.email}`, windowMs), this.throttle.fail(ipKey, windowMs)])
      await this.audit.record({ actorId: user?.id ?? null, actorEmail: user?.email ?? null, action: "auth.login_failed", target: input.email, ip: origin.ip })
      throw new AppError(401, "invalid_credentials", "Incorrect email or password.")
    }
    if (user.status !== "active") {
      await this.audit.record({ actorId: user.id, actorEmail: user.email, action: "auth.login_blocked", target: user.email, ip: origin.ip, detail: { reason: user.status } })
      throw new AppError(403, "account_suspended", "This account is suspended. Contact an administrator.")
    }

    await this.throttle.reset(`email:${input.email}`)
    const issued = await this.issue(user, input.remember, origin)
    await this.audit.record({ actorId: user.id, actorEmail: user.email, action: "auth.login", target: user.email, ip: origin.ip })
    return issued
  }

  /** One-click demo access. The route only exists when DEMO_LOGIN is on. */
  async demoLogin(input: { role: string; remember: boolean }, origin: Origin): Promise<Issued> {
    if (!this.config.demoLogin) throw notFound()
    if (!isRoleId(input.role)) throw badRequest("validation_error", "Unknown role.")
    const user = await this.users.demoForRole(input.role)
    if (!user) throw notFound("No demo account for that role.")
    const issued = await this.issue(user, input.remember, origin)
    await this.audit.record({ actorId: user.id, actorEmail: user.email, action: "auth.login_demo", target: user.email, ip: origin.ip })
    return issued
  }

  async logout(auth: AuthContext | null, ip: string): Promise<void> {
    if (!auth) return
    await this.sessions.revoke(auth.sessionId)
    await this.audit.record({ actorId: auth.user.id, actorEmail: auth.user.email, action: "auth.logout", target: auth.user.email, ip })
  }

  async changePassword(auth: AuthContext, input: { currentPassword: string; newPassword: string }, ip: string): Promise<void> {
    const key = `pw:${auth.user.id}`
    const wait = await this.throttle.blockedFor(key, this.config.loginMaxAttempts)
    if (wait > 0) throw new AppError(429, "too_many_attempts", "Too many attempts. Try again later.", { retryAfterSeconds: wait })

    if (!(await verifyPassword(input.currentPassword, auth.user.passwordHash))) {
      await this.throttle.fail(key, this.config.loginWindowMs)
      throw badRequest("invalid_credentials", "Your current password is incorrect.")
    }
    if (input.newPassword === input.currentPassword) {
      throw badRequest("validation_error", "Choose a password you haven't used here.")
    }

    await this.users.update(auth.user.id, { passwordHash: await hashPassword(input.newPassword) })
    // Signs out every other device; this one stays.
    await this.sessions.revokeAllForUser(auth.user.id, auth.sessionId)
    await this.throttle.reset(key)
    await this.audit.record({ actorId: auth.user.id, actorEmail: auth.user.email, action: "auth.password_changed", target: auth.user.email, ip })
  }

  /** Turns a cookie token into a request context, or null if it isn't valid right now. */
  async resolve(token: string): Promise<AuthContext | null> {
    const id = hashToken(token)
    const session = await this.sessions.find(id)
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null

    const user = await this.users.byId(session.userId)
    if (!user || user.status !== "active") return null

    if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) void this.sessions.touch(id).catch(() => undefined) // best-effort bookkeeping; must never reject unhandled

    return { user, permissions: new Set(await this.access.permissionsFor(user.roleId)), sessionId: id }
  }
}
