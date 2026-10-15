import mongoose from "mongoose"

import type { Config } from "../config.ts"
import { runMigrations } from "../db/migrate.ts"
import { createModels, type Models } from "../db/models.ts"

export type Database = {
  models: Models
  /** Applied migration ids on this boot (empty when already up to date). */
  migrated: string[]
  close: () => Promise<void>
}

/**
 * Opens a dedicated connection (not the global mongoose one, so tests can run many
 * isolated apps), runs pending migrations, and builds the models.
 *
 * The connection string carries credentials: it is never logged or put in errors.
 */
export async function connectDatabase(config: Pick<Config, "mongoUri" | "mongoDb">): Promise<Database> {
  const conn = mongoose.createConnection(config.mongoUri, {
    dbName: config.mongoDb,
    serverSelectionTimeoutMS: 10_000,
    autoIndex: false,
  })
  try {
    await conn.asPromise()
  } catch (err) {
    await conn.close().catch(() => undefined)
    // Re-throw without the driver's message, which can echo parts of the URI.
    throw new Error(`Could not connect to MongoDB (${(err as Error).name}). Check MONGODB_URI and network access.`)
  }
  const migrated = await runMigrations(conn)
  return { models: createModels(conn), migrated, close: () => conn.close() }
}
