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
import { useApps } from "@/data/apps-context"
import { integer, NO_VALUE } from "@/lib/format"

// Same five cards as the design. Figures the backend can't supply yet (revenue,
// installs, expenses, profit) show "—" with a "not connected" hint where the
// sparkline would be. Active Subscribers is real: active entitlements across apps.

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="flex h-14 items-center text-xs text-muted-foreground">{children}</p>
}

const NO_DELTA = (icon: React.ReactNode) => ({ label: NO_VALUE, icon })

export function KpiOverview() {
  const { apps, status } = useApps()

  const known = apps.map((a) => a.subscribers).filter((n): n is number => n !== null)
  const subscribers = known.length > 0 ? known.reduce((s, n) => s + n, 0) : null
  const subsValue = status === "loading" ? NO_VALUE : subscribers === null ? NO_VALUE : integer.format(subscribers)

  const KPIS: KpiCardProps[] = [
    {
      title: "Total Revenue",
      value: NO_VALUE,
      icon: <BanknoteIcon />,
      tone: "mint",
      delta: NO_DELTA(<TrendingUpIcon />),
      caption: "not connected",
      breakdown: [
        { label: "MRR", value: NO_VALUE },
        { label: "IAP", value: NO_VALUE },
      ],
      children: <Hint>Connect Google Play to see revenue</Hint>,
    },
    {
      title: "Active Subscribers",
      value: subsValue,
      icon: <UsersIcon />,
      tone: "indigo",
      delta: NO_DELTA(<ArrowUpRightIcon />),
      caption: subscribers === null ? "no data yet" : "active entitlements",
      breakdown: [
        { label: "Churn", value: NO_VALUE },
        { label: "LTV", value: NO_VALUE },
      ],
      children: (
        <Hint>
          {subscribers === null
            ? "Map Play products in Billing Setup"
            : `Across ${known.length} app${known.length === 1 ? "" : "s"}`}
        </Hint>
      ),
    },
    {
      title: "Total Installs",
      value: NO_VALUE,
      icon: <DownloadIcon />,
      tone: "stone",
      delta: NO_DELTA(<ZapIcon />),
      caption: "not connected",
      breakdown: [
        { label: "iOS", value: NO_VALUE },
        { label: "Android", value: NO_VALUE },
      ],
      children: <Hint>Needs Google Play reporting</Hint>,
    },
    {
      title: "Total Expenses",
      value: NO_VALUE,
      icon: <ReceiptTextIcon />,
      tone: "stone-deep",
      delta: NO_DELTA(<ArrowDownRightIcon />),
      caption: "not connected",
      breakdown: [
        { label: "Infra", value: NO_VALUE },
        { label: "Mktg", value: NO_VALUE },
      ],
      children: <Hint>No expenses recorded yet</Hint>,
    },
    {
      title: "Net Profit",
      value: NO_VALUE,
      icon: <PiggyBankIcon />,
      tone: "blue",
      delta: NO_DELTA(<TrendingUpIcon />),
      caption: "not connected",
      breakdown: [
        { label: "Margin", value: NO_VALUE },
        { label: "EBITDA", value: NO_VALUE },
      ],
      children: <Hint>Needs revenue and expenses</Hint>,
    },
  ]

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
