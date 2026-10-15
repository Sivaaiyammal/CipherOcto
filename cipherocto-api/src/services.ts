import type { FastifyBaseLogger } from "fastify"

import type { Config } from "./config.ts"
import type { Models } from "./db/models.ts"
import { AccessService } from "./modules/access/access.service.ts"
import { AppsRepository } from "./modules/apps/apps.repository.ts"
import { AppsService } from "./modules/apps/apps.service.ts"
import { RolesRepository } from "./modules/access/roles.repository.ts"
import { AuditRepository } from "./modules/audit/audit.repository.ts"
import { AuditService } from "./modules/audit/audit.service.ts"
import { AuthService } from "./modules/auth/auth.service.ts"
import { PoliciesRepository } from "./modules/policies/policies.repository.ts"
import { PoliciesService } from "./modules/policies/policies.service.ts"
import { SessionsRepository } from "./modules/auth/sessions.repository.ts"
import { ThrottleRepository } from "./modules/auth/throttle.repository.ts"
import { GooglePlayVerifier, GooglePushAuthenticator } from "./modules/subscriptions/play.google.ts"
import {
  UnconfiguredPushAuthenticator,
  UnconfiguredVerifier,
  type PlayVerifier,
  type PushAuthenticator,
} from "./modules/subscriptions/play.ts"
import {
  EntitlementsRepository,
  EventsRepository,
  ProductsRepository,
  PurchasesRepository,
} from "./modules/subscriptions/subscriptions.repository.ts"
import { SubscriptionsService } from "./modules/subscriptions/subscriptions.service.ts"
import { UsersRepository } from "./modules/users/users.repository.ts"
import { UsersService } from "./modules/users/users.service.ts"

/**
 * Composition root: the only place that knows which repository backs which
 * service. Services depend on repositories, never on Mongoose.
 */
export type Overrides = {
  /** Replace Google Play verification (tests, offline development). */
  verifier?: PlayVerifier
  /** Replace Pub/Sub push authentication. */
  pushAuth?: PushAuthenticator
}

export function createServices(config: Config, models: Models, log: FastifyBaseLogger | null, overrides: Overrides = {}) {
  const usersRepo = new UsersRepository(models)
  const sessionsRepo = new SessionsRepository(models)
  const throttleRepo = new ThrottleRepository(models)
  const rolesRepo = new RolesRepository(models)

  const access = new AccessService(rolesRepo)
  const audit = new AuditService(new AuditRepository(models), log)
  const users = new UsersService({ users: usersRepo, access, audit, sessions: sessionsRepo })
  const auth = new AuthService({ config, users: usersRepo, usersService: users, sessions: sessionsRepo, throttle: throttleRepo, access, audit })

  const appsRepo = new AppsRepository(models)
  const apps = new AppsService({ repo: appsRepo, audit })
  const policies = new PoliciesService({ repo: new PoliciesRepository(models), apps, audit })

  // With no credentials we fail closed: purchases are never granted unverified.
  const verifier =
    overrides.verifier ?? (config.googleServiceAccount ? new GooglePlayVerifier(config.googleServiceAccount) : new UnconfiguredVerifier())
  const pushAuth =
    overrides.pushAuth ??
    (config.rtdn ? new GooglePushAuthenticator(config.rtdn.audience, config.rtdn.serviceAccountEmail) : new UnconfiguredPushAuthenticator())

  const subscriptions = new SubscriptionsService({
    config,
    apps: appsRepo,
    products: new ProductsRepository(models),
    purchases: new PurchasesRepository(models),
    entitlements: new EntitlementsRepository(models),
    events: new EventsRepository(models),
    verifier,
    audit,
    log,
  })

  return { access, audit, users, auth, apps, policies, subscriptions, pushAuth, repos: { users: usersRepo, sessions: sessionsRepo, apps: appsRepo } }
}

export type Services = ReturnType<typeof createServices>
