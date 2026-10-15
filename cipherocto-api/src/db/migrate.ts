import type { Connection } from "mongoose"
import type { ObjectId } from "mongodb"

import { slugBase, uniqueSlug } from "../shared/slug.ts"

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
  {
    id: "0002-apps-and-subscriptions",
    async up(db) {
      // A package name is unique within its platform registry (SKILL.md §4A).
      await db.collection("apps").createIndex({ platform: 1, packageName: 1 }, { unique: true, name: "apps_package_unique" })
      await db.collection("app_sdk_keys").createIndex({ appId: 1 }, { name: "sdk_keys_app" })

      await db.collection("subscription_products").createIndex({ appId: 1, productId: 1 }, { unique: true, name: "products_app_product" })

      // One record per purchase token per app; also what makes verify-twice idempotent.
      await db.collection("purchase_records").createIndex({ appId: 1, tokenHash: 1 }, { unique: true, name: "purchases_app_token" })
      await db.collection("purchase_records").createIndex({ appId: 1, subjectId: 1 }, { name: "purchases_subject" })
      await db.collection("purchase_records").createIndex({ state: 1, lastVerifiedAt: 1 }, { name: "purchases_reconcile" })

      await db.collection("entitlements").createIndex({ appId: 1, subjectId: 1, key: 1 }, { unique: true, name: "entitlements_subject_key" })

      await db.collection("subscription_events").createIndex({ appId: 1, at: -1 }, { name: "sub_events_app_at" })
      await db.collection("subscription_events").createIndex({ purchaseId: 1, at: -1 }, { name: "sub_events_purchase" })
      // Redelivered Pub/Sub messages hit this and are ignored. Partial: SDK events have no provider id.
      await db.collection("subscription_events").createIndex(
        { providerEventId: 1 },
        { unique: true, partialFilterExpression: { providerEventId: { $type: "string" } }, name: "sub_events_provider_unique" }
      )
    },
  },
  {
    id: "0003-app-slugs-and-policies",
    async up(db) {
      // Give every pre-existing app a public slug before the unique index is built.
      const apps = db.collection<{ _id: ObjectId; name?: string; packageName?: string; slug?: string }>("apps")
      const taken = new Set<string>()
      const missing: { _id: ObjectId; name?: string; packageName?: string }[] = []
      for await (const a of apps.find({}, { projection: { name: 1, packageName: 1, slug: 1 } })) {
        if (a.slug) taken.add(a.slug)
        else missing.push(a)
      }
      for (const a of missing) {
        const slug = uniqueSlug(slugBase(a.name, a.packageName), taken)
        taken.add(slug)
        await apps.updateOne({ _id: a._id }, { $set: { slug } })
      }
      await apps.createIndex({ slug: 1 }, { unique: true, name: "apps_slug_unique" })

      // One row per (app, kind, version); the highest version is the live page.
      await db
        .collection("app_policies")
        .createIndex({ appId: 1, kind: 1, version: -1 }, { unique: true, name: "policies_app_kind_version" })
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
