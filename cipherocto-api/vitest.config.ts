import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // The first run downloads an embedded mongod; allow for it.
    hookTimeout: 180_000,
    testTimeout: 30_000,
  },
})
