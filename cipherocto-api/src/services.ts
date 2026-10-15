import type { FastifyBaseLogger } from "fastify"

import type { Config } from "./config.ts"
import type { Models } from "./db/models.ts"
import { AccessService } from "./modules/access/access.service.ts"
import { RolesRepository } from "./modules/access/roles.repository.ts"
import { AuditRepository } from "./modules/audit/audit.repository.ts"
import { AuditService } from "./modules/audit/audit.service.ts"
import { AuthService } from "./modules/auth/auth.service.ts"
import { SessionsRepository } from "./modules/auth/sessions.repository.ts"
import { ThrottleRepository } from "./modules/auth/throttle.repository.ts"
import { UsersRepository } from "./modules/users/users.repository.ts"
import { UsersService } from "./modules/users/users.service.ts"

/**
 * Composition root: the only place that knows which repository backs which
 * service. Services depend on repositories, never on Mongoose.
 */
export function createServices(config: Config, models: Models, log: FastifyBaseLogger | null) {
  const usersRepo = new UsersRepository(models)
  const sessionsRepo = new SessionsRepository(models)
  const throttleRepo = new ThrottleRepository(models)
  const rolesRepo = new RolesRepository(models)

  const access = new AccessService(rolesRepo)
  const audit = new AuditService(new AuditRepository(models), log)
  const users = new UsersService({ users: usersRepo, access, audit, sessions: sessionsRepo })
  const auth = new AuthService({ config, users: usersRepo, usersService: users, sessions: sessionsRepo, throttle: throttleRepo, access, audit })

  return { access, audit, users, auth, repos: { users: usersRepo, sessions: sessionsRepo } }
}

export type Services = ReturnType<typeof createServices>
