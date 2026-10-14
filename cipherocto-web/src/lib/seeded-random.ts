/** Stable 32-bit hash of a string (FNV-1a). */
export function hashString(value: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Deterministic PRNG (mulberry32) so mock data is stable across renders and
 * reloads for the same seed.
 */
export function seededRandom(seed: string | number) {
  let a = typeof seed === "number" ? seed >>> 0 : hashString(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random number in [min, max) from a seeded generator. */
export function between(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min)
}
