import { FlaskConicalIcon, RocketIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NO_VALUE } from "@/lib/format"

// Experiments need the remote-config service and revenue data, neither connected
// yet, so there is no recommended target or projected uplift to show.
export function AbExperimentCard({
  target = NO_VALUE,
  projectedUplift = NO_VALUE,
}: {
  target?: string
  projectedUplift?: string
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mint-border/60 bg-linear-to-br from-mint-surface via-card to-blue-surface p-5 shadow-[var(--shadow-1)]">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-mint-border [&_svg]:size-5">
        <FlaskConicalIcon />
      </span>

      <div>
        <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
          Launch Next A/B Experiment
        </h2>
        <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
          Ready to test a new annual paywall variant? CipherOcto lets you launch
          zero-app-release paywall tests within 3 minutes.
        </p>
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 rounded-xl bg-card/70 p-3 text-xs">
        <dt className="text-muted-foreground">Recommended target:</dt>
        <dd className="text-right font-bold text-foreground">{target}</dd>
        <dt className="text-muted-foreground">Projected ARR Uplift:</dt>
        <dd className="text-right font-bold text-mint tabular-nums">
          {projectedUplift}
        </dd>
      </dl>

      <Button
        className="mt-auto h-12 rounded-xl text-sm font-semibold"
        disabled
        title="Remote config isn't connected yet"
      >
        <RocketIcon className="text-mint-border" />
        Launch Remote A/B Test
      </Button>
    </section>
  )
}
