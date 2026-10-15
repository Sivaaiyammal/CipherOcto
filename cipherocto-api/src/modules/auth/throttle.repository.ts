import type { Models } from "../../db/models.ts"

/**
 * Failed-login counters keyed by email or IP, stored in MongoDB so the limit
 * survives restarts and is shared across API instances. A TTL index deletes
 * each counter when its window ends.
 *
 * Unknown emails are counted too, so "locked" never reveals whether an account exists.
 */
export class ThrottleRepository {
  private readonly model: Models["Throttle"]

  constructor(models: Models) {
    this.model = models.Throttle
  }

  /** Seconds until `key` may try again, or 0 when it is not blocked. */
  async blockedFor(key: string, max: number, now = new Date()): Promise<number> {
    const hit = await this.model.findOne({ _id: key, windowEnd: { $gt: now }, count: { $gte: max } }).lean<{ windowEnd: Date } | null>()
    return hit ? Math.max(1, Math.ceil((hit.windowEnd.getTime() - now.getTime()) / 1000)) : 0
  }

  async fail(key: string, windowMs: number, now = new Date()): Promise<void> {
    const inWindow = await this.model.updateOne({ _id: key, windowEnd: { $gt: now } }, { $inc: { count: 1 } })
    if (inWindow.modifiedCount === 0) {
      await this.model.updateOne(
        { _id: key },
        { $set: { count: 1, windowEnd: new Date(now.getTime() + windowMs) } },
        { upsert: true }
      )
    }
  }

  async reset(key: string): Promise<void> {
    await this.model.deleteOne({ _id: key })
  }
}
