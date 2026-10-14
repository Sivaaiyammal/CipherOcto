import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RegisterAppCard({ slotsLeft }: { slotsLeft: number }) {
  return (
    <article className="group flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[18px] bg-foreground/[0.03] p-6 text-center transition-colors hover:bg-foreground/[0.05]">
      <span className="flex size-16 items-center justify-center rounded-full bg-neutral-strong text-muted-foreground shadow-[var(--shadow-1)] transition-all duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
        <PlusIcon className="size-7" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <h3 className="text-lg leading-[26px] font-bold text-foreground">Register New App</h3>
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          Connect StoreKit 2, Google Play API credentials, or link an existing
          bundle ID in seconds.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 pt-2">
        <Button className="h-10 rounded-xl px-4 text-[13px] font-semibold shadow-[var(--shadow-1)]" disabled={slotsLeft <= 0}>
          <PlusIcon />
          Setup App In 3 Minutes
        </Button>
        <p className="text-xs text-muted-foreground tabular-nums">
          {slotsLeft} slot{slotsLeft === 1 ? "" : "s"} remaining in Octo Corp Enterprise
        </p>
      </div>
    </article>
  )
}
