import * as React from "react"
import {
  BadgeCheckIcon,
  HistoryIcon,
  LandmarkIcon,
  ToggleRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// Mock events until the audit log API is connected.
const ACTIVITY: {
  id: string
  icon: React.ReactNode
  tone: string
  message: React.ReactNode
  time: string
}[] = [
  {
    id: "flag",
    icon: <ToggleRightIcon />,
    tone: "bg-mint-hover text-mint",
    message: (
      <>
        Remote flag{" "}
        <code className="inline-block rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] break-all">
          paywall_v3_experiment
        </code>{" "}
        enabled by <strong className="font-semibold">Elena</strong>
      </>
    ),
    time: "14 minutes ago",
  },
  {
    id: "payout",
    icon: <LandmarkIcon />,
    tone: "bg-stream-iap-soft text-foreground/80",
    message: (
      <>
        Stripe payout processed:{" "}
        <strong className="font-semibold tabular-nums">$42,190.00</strong> to
        Chase Treasury
      </>
    ),
    time: "2 hours ago",
  },
  {
    id: "release",
    icon: <BadgeCheckIcon />,
    tone: "bg-neutral-strong text-foreground",
    message: (
      <>
        Release <strong className="font-semibold text-mint">v2.8.4</strong>{" "}
        approved on App Store Review
      </>
    ),
    time: "5 hours ago",
  },
]

export function ActivityStream() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <HistoryIcon className="size-4 text-mint" />
          Activity Stream
        </h2>
        <a
          href="#"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          View All
        </a>
      </header>

      <ol className="flex flex-col gap-4">
        {ACTIVITY.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
                item.tone
              )}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
              <p>{item.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
