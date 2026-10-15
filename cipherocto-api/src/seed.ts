import type { Config } from "./config.ts"
import { ROLE_DEFINITIONS } from "./modules/access/permissions.ts"
import { hashPassword } from "./shared/crypto.ts"
import { randomPassword } from "./shared/crypto.ts"
import type { Services } from "./services.ts"

type Log = (msg: string) => void

/**
 * Idempotent first-run setup:
 *  - the initial admin (from SEED_ADMIN_*) when it doesn't exist yet
 *  - one demo account per role when DEMO_LOGIN is on
 *
 * Demo accounts get a random, discarded password: they are only reachable
 * through /auth/demo, which doesn't exist in production.
 */
export async function seedDatabase(services: Services, config: Config, log: Log = () => undefined) {
  const { repos } = services

  if (config.seedAdmin && !(await repos.users.byEmail(config.seedAdmin.email))) {
    await repos.users.create({
      email: config.seedAdmin.email,
      name: config.seedAdmin.name,
      roleId: "admin",
      passwordHash: await hashPassword(config.seedAdmin.password),
    })
    log(`Created initial admin ${config.seedAdmin.email}`)
  }

  if (config.demoLogin) {
    for (const role of ROLE_DEFINITIONS) {
      if (await repos.users.demoForRole(role.id)) continue
      await repos.users.create({
        email: `demo.${role.id}@cipherocto.app`,
        name: `Demo ${role.label.split(" / ")[0]}`,
        roleId: role.id,
        passwordHash: await hashPassword(randomPassword()),
        isDemo: true,
      })
    }
  }

  if ((await repos.users.countActiveAdmins()) === 0) {
    log("WARNING: no active admin exists. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then restart.")
  }
}
