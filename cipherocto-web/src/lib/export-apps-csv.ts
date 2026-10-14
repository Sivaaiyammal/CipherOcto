import {
  PLATFORM_LABEL,
  releaseStatusLabel,
  type PortfolioApp,
} from "@/data/apps"

export function exportAppsCsv(apps: PortfolioApp[], filename = "cipherocto-apps") {
  const header = [
    "App",
    "Version",
    "Build",
    "Category",
    "Installs (30D)",
    "Revenue / mo (USD)",
    "Subscribers",
    "Release Status",
    "Platforms",
    "Bundle ID",
    "MAU",
    "Crash-Free %",
    "Rating",
  ]
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows = apps.map((a) =>
    [
      a.name,
      a.version,
      a.build,
      a.category,
      a.installs30d,
      a.revenueMonthly,
      a.subscribers,
      releaseStatusLabel(a.status),
      a.platforms.map((p) => PLATFORM_LABEL[p]).join(" / "),
      a.bundleId,
      a.mau,
      a.crashFree,
      a.rating,
    ]
      .map(escape)
      .join(",")
  )
  const blob = new Blob([[header.map(escape).join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
