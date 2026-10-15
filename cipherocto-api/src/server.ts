import { buildApp } from "./app.ts"
import { seedDatabase } from "./seed.ts"

const app = await buildApp()
const { settings: config, services } = app

await seedDatabase(services, config, (msg) => app.log.info(msg))

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`)
  await app.close()
  process.exit(0)
}
process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

await app.listen({ port: config.port, host: config.host })
if (config.demoLogin) app.log.warn("DEMO_LOGIN is on: /api/v1/auth/demo signs in without a password. Dev only.")
