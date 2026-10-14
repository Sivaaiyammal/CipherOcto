import { LanguagesIcon, SmartphoneIcon, TrophyIcon } from "lucide-react"

import type { AsoInsights } from "@/data/app-insights"
import { integer } from "@/lib/format"

const VISIBLE_LOCALES = 7

export function MetadataAso({ aso }: { aso: AsoInsights }) {
  const extra = aso.locales.length - VISIBLE_LOCALES

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
          <LanguagesIcon className="size-4.5 text-mint" />
          Metadata &amp; ASO
        </h2>
        <span className="rounded-full bg-mint-hover px-2 py-0.5 text-xs font-semibold text-mint tabular-nums">
          {aso.locales.length} Locales
        </span>
      </header>

      <div className="rounded-xl bg-background p-3">
        <p className="text-[11px] font-bold tracking-[0.04em] text-subtle-foreground uppercase">
          Top Storefront Keyword Ranks
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
          {aso.keywords.map((k) => (
            <li key={k.term} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground">“{k.term}”</span>
              <span
                className={
                  k.top
                    ? "inline-flex shrink-0 items-center gap-1 rounded bg-card px-2 py-0.5 text-xs font-bold text-mint"
                    : "shrink-0 rounded bg-card px-2 py-0.5 text-xs font-bold text-foreground"
                }
              >
                {k.top && <TrophyIcon className="size-3" />}
                {k.rank}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Storefront Localization Coverage</span>
          <span className="font-bold text-foreground tabular-nums">
            {Math.round((aso.localized / aso.locales.length) * 100)}% ({aso.localized} / {aso.locales.length} complete)
          </span>
        </div>
        <ul className="flex flex-wrap gap-1">
          {aso.locales.slice(0, VISIBLE_LOCALES).map((l) => (
            <li key={l} className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">
              {l}
            </li>
          ))}
          {extra > 0 && (
            <li className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              +{extra} more
            </li>
          )}
        </ul>
      </div>

      {aso.appClip && (
        <div className="flex items-center justify-between rounded-xl bg-background p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-card text-mint">
              <SmartphoneIcon className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-foreground">App Clip / Instant App</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {integer.format(aso.appClip.launches)} launches • {aso.appClip.installRate}% full install rate
              </p>
            </div>
          </div>
          <span className="size-2 rounded-full bg-mint" aria-label="Healthy" />
        </div>
      )}
    </section>
  )
}
