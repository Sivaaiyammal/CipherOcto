export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const integer = new Intl.NumberFormat("en-US")

const compactUsdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
})

/** $184.9k — lower-case suffix per the design */
export function formatCompactUsd(value: number) {
  return compactUsdFormat.format(value).replace(/[KMB]$/, (s) => s.toLowerCase())
}

/** 1.42M, 980k, 84.2k */
export function formatCompact(value: number) {
  return compactFormat.format(value).replace(/K$/, "k")
}

export function formatSignedPercent(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`
}

// ── Null-safe variants ────────────────────────────────────────────────────
// Metrics the backend can't supply yet (revenue, installs, ratings…) are `null`.
// They render as an em dash, never as a made-up number.

export const NO_VALUE = "—"

export const orDash = (value: number | null | undefined, format: (n: number) => string) =>
  value === null || value === undefined ? NO_VALUE : format(value)
