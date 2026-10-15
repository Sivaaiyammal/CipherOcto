import { buildApp } from "./app.ts"
import { seedDatabase } from "./seed.ts"

const app = await buildApp()
const { settings: config, services } = app

await seedDatabase(services, config, (msg) => app.log.info(msg))

// Safety net for lost or late notifications: re-verify stale purchases on a schedule.
// Safe on every instance — reconciliation is idempotent.
let reconcileTimer: NodeJS.Timeout | undefined
if (config.reconcileIntervalMs > 0) {
  reconcileTimer = setInterval(() => {
    services.subscriptions
      .reconcile()
      .then((r) => r.checked > 0 && app.log.info(r, "reconciled purchases"))
      .catch((err) => app.log.error({ err }, "reconcile run failed"))
  }, config.reconcileIntervalMs)
  reconcileTimer.unref()
}

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`)
  if (reconcileTimer) clearInterval(reconcileTimer)
  await app.close()
  process.exit(0)
}
process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

await app.listen({ port: config.port, host: config.host })
if (config.demoLogin) app.log.warn("DEMO_LOGIN is on: /api/v1/auth/demo signs in without a password. Dev only.")
