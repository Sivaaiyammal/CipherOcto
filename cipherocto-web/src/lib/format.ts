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
