import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RegisterAppCard({ slotsLeft }: { slotsLeft: number }) {
  return (
    <article className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-neutral-strong text-foreground">
        <PlusIcon className="size-6" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-foreground">Register New App</h3>
        <p className="mx-auto mt-1 max-w-64 text-[13px] leading-[18px] text-muted-foreground">
          Connect StoreKit 2, Google Play API credentials, or link an existing
          bundle ID in seconds.
        </p>
      </div>
      <Button className="h-10 rounded-xl px-4 text-[13px] font-semibold" disabled={slotsLeft <= 0}>
        <PlusIcon />
        Setup App in 3 Minutes
      </Button>
      <p className="text-xs text-muted-foreground tabular-nums">
        {slotsLeft} slot{slotsLeft === 1 ? "" : "s"} remaining in Octo Corp Enterprise
      </p>
    </article>
  )
}
