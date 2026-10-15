import { Link } from "react-router-dom"
import {
  CirclePlusIcon,
  FileSpreadsheetIcon,
  ListChecksIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TagIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/lib/use-current-user"
import { cn } from "@/lib/utils"

const actionBase =
  "h-10 gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold tracking-[0.01em] shadow-none [&_svg]:size-4!"
const chipBase =
  "h-9 gap-1.5 rounded-full bg-foreground/[0.04] px-3.5 text-[13px] font-medium text-muted-foreground shadow-none hover:bg-foreground/[0.08] hover:text-foreground"

export function WelcomeBanner({
  liveApps,
  periodLabel,
}: {
  liveApps: number
  periodLabel: string
}) {
  const currentUser = useCurrentUser()
  return (
    <section className="flex flex-col gap-5 px-4 lg:px-6 @3xl/main:flex-row @3xl/main:items-start @3xl/main:justify-between">
      <div className="max-w-md">
        <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">
          Welcome back, {currentUser.firstName}{" "}
          <span role="img" aria-label="waving hand">
            👋
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what happened with your{" "}
          <strong className="font-semibold text-foreground">
            {liveApps} live apps
          </strong>{" "}
          over the {periodLabel}.
        </p>
      </div>

      <div className="flex max-w-xl flex-wrap items-center gap-2.5 @3xl/main:justify-end">
        <Button
          asChild
          className={cn(
            actionBase,
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Link to="/apps/new">
            <CirclePlusIcon className="text-mint-border" />
            Add App
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            actionBase,
            "bg-stream-iap-soft text-foreground/80 hover:bg-neutral-strong"
          )}
        >
          <SlidersHorizontalIcon />
          Edit Remote Config
        </Button>
        <Button
          variant="ghost"
          className={cn(
            actionBase,
            "bg-blue-hover text-tertiary hover:bg-blue-border/70 hover:text-tertiary"
          )}
        >
          <TagIcon />
          Manage Subscriptions
        </Button>
        <Button
          variant="ghost"
          className={cn(
            actionBase,
            "bg-neutral-strong text-foreground hover:bg-neutral-deep"
          )}
        >
          <FileSpreadsheetIcon className="text-mint" />
          Financial Report
        </Button>
        <div className="hidden items-center gap-2 @6xl/main:flex">
          <Button variant="ghost" className={chipBase}>
            <PlusIcon />
            Expense
          </Button>
          <Button variant="ghost" className={chipBase}>
            <ListChecksIcon />
            Task
          </Button>
        </div>
      </div>
    </section>
  )
}
