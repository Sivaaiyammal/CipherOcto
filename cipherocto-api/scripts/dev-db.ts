// Starts a local, persistent MongoDB for development when Docker and Atlas aren't
// available:  npm run dev:db   then set MONGODB_URI=mongodb://127.0.0.1:27017
// Data lives in ./data/mongo and survives restarts.
import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { MongoMemoryServer } from "mongodb-memory-server"

const dbPath = resolve("data/mongo")
mkdirSync(dbPath, { recursive: true })

const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
})
console.log(`MongoDB ready: ${mongod.getUri()}  (data in ${dbPath})`)
console.log("Press Ctrl+C to stop.")

const stop = async () => {
  await mongod.stop()
  process.exit(0)
}
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
