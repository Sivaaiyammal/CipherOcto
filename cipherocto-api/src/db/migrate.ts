import type { Connection } from "mongoose"

type Db = NonNullable<Connection["db"]>

// Ordered and append-only: never edit a migration that has shipped, add a new one.
// MongoDB is schemaless, so migrations here own indexes and data fixes.

type Migration = { id: string; up: (db: Db) => Promise<void> }

const MIGRATIONS: Migration[] = [
  {
    id: "0001-auth-foundation",
    async up(db) {
      await db.collection("users").createIndex({ email: 1 }, { unique: true, name: "users_email_unique" })
      await db.collection("users").createIndex({ roleId: 1, status: 1 }, { name: "users_role_status" })

      await db.collection("sessions").createIndex({ userId: 1 }, { name: "sessions_user" })
      // Mongo deletes the document itself once expiresAt passes.
      await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "sessions_ttl" })

      await db.collection("audit_logs").createIndex({ at: -1 }, { name: "audit_at" })
      await db.collection("audit_logs").createIndex({ actorId: 1, at: -1 }, { name: "audit_actor" })

      await db.collection("login_throttle").createIndex({ windowEnd: 1 }, { expireAfterSeconds: 0, name: "throttle_ttl" })
    },
  },
]

export async function runMigrations(conn: Connection): Promise<string[]> {
  const db = conn.db
  if (!db) throw new Error("Database connection is not open")
  const ledger = db.collection<{ _id: string; at: Date }>("_migrations")
  const applied: string[] = []

  for (const m of MIGRATIONS) {
    if (await ledger.findOne({ _id: m.id })) continue
    await m.up(db)
    try {
      await ledger.insertOne({ _id: m.id, at: new Date() })
    } catch (err) {
      // Another instance won the race; the migration is idempotent so that's fine.
      if ((err as { code?: number }).code !== 11000) throw err
    }
    applied.push(m.id)
  }
  return applied
}
