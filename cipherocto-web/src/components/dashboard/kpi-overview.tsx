import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  DownloadIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

import { KpiCard, type KpiCardProps } from "@/components/dashboard/kpi-card"

// Mock figures until the analytics API is connected.
const KPIS: KpiCardProps[] = [
  {
    title: "Total Revenue",
    value: "$184,920.40",
    icon: <BanknoteIcon />,
    tone: "mint",
    delta: { label: "+14.8%", icon: <TrendingUpIcon /> },
    caption: "vs last month",
    trend: [42, 44, 43, 45, 44, 47, 52, 55, 56, 57, 58, 61],
    breakdown: [
      { label: "MRR", value: "$142.3k" },
      { label: "IAP", value: "$42.6k" },
    ],
  },
  {
    title: "Active Subscribers",
    value: "42,850",
    icon: <UsersIcon />,
    tone: "indigo",
    delta: { label: "+8.2%", icon: <ArrowUpRightIcon /> },
    caption: "new users",
    trend: [30, 31, 33, 34, 34, 36, 38, 40, 41, 43, 45, 48],
    breakdown: [
      { label: "Churn", value: "1.4%" },
      { label: "LTV", value: "$68.20" },
    ],
  },
  {
    title: "Total Installs",
    value: "1.24M",
    icon: <DownloadIcon />,
    tone: "stone",
    delta: { label: "+22.5%", icon: <ZapIcon /> },
    caption: "spike",
    trend: [20, 21, 22, 22, 23, 25, 26, 30, 31, 31, 33, 35],
    breakdown: [
      { label: "iOS", value: "64%" },
      { label: "Android", value: "36%" },
    ],
  },
  {
    title: "Total Expenses",
    value: "$38,410.00",
    icon: <ReceiptTextIcon />,
    tone: "stone-deep",
    delta: { label: "-3.1%", icon: <ArrowDownRightIcon /> },
    caption: "optimized",
    trend: [40, 40, 39, 38, 38, 37, 36, 36, 35, 35, 34, 33],
    breakdown: [
      { label: "Infra", value: "$18.2k" },
      { label: "Mktg", value: "$20.2k" },
    ],
  },
  {
    title: "Net Profit",
    value: "$146,510.40",
    icon: <PiggyBankIcon />,
    tone: "blue",
    delta: { label: "+19.4%", icon: <TrendingUpIcon /> },
    caption: "margin",
    trend: [30, 31, 31, 33, 34, 35, 37, 39, 40, 40, 41, 43],
    breakdown: [
      { label: "Margin", value: "79.2%" },
      { label: "EBITDA", value: "$152.8k" },
    ],
  },
]

export function KpiOverview() {
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5"
    >
      {KPIS.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </section>
  )
}
