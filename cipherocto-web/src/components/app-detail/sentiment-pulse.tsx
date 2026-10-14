import { MessageSquareHeartIcon, StarIcon, TriangleAlertIcon } from "lucide-react"

import type { SentimentInsights } from "@/data/app-insights"

export function SentimentPulse({ sentiment, version }: { sentiment: SentimentInsights; version: string }) {
  const { positive, neutral, negative, review, issue } = sentiment

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-1)] lg:p-6">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">
          <MessageSquareHeartIcon className="size-4.5 text-mint" />
          User Sentiment Pulse
        </h2>
        <span className="text-xs font-bold text-mint tabular-nums">{positive}% Positive</span>
      </header>

      <div className="space-y-1">
        <div
          className="flex h-2 overflow-hidden rounded-full bg-neutral-strong"
          role="img"
          aria-label={`${positive}% positive, ${neutral}% neutral, ${negative}% reported issues`}
        >
          <div className="h-full bg-stream-mrr" style={{ width: `${positive}%` }} />
          <div className="h-full bg-stream-iap-soft" style={{ width: `${neutral}%` }} />
          <div className="h-full bg-destructive" style={{ width: `${negative}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span className="font-bold text-mint">{positive}% Positive</span>
          <span>{neutral}% Neutral</span>
          <span className="font-bold text-destructive">{negative}% Inquiries</span>
        </div>
      </div>

      <figure className="space-y-2 rounded-xl bg-background p-3.5">
        <figcaption className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="flex" aria-label={`${review.stars} stars`}>
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon
                  key={i}
                  className={i < review.stars ? "size-3 fill-amber text-amber" : "size-3 text-amber/30"}
                />
              ))}
            </span>
            <span className="text-xs font-bold text-foreground">{review.author}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            v{version} • {review.ago}
          </span>
        </figcaption>
        <blockquote className="text-[13px] leading-snug text-foreground italic">“{review.text}”</blockquote>
      </figure>

      <div className="flex items-start gap-2.5 rounded-xl bg-pink-surface p-3">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="leading-tight">
          <p className="text-xs font-bold text-destructive">{issue.title}</p>
          <p className="mt-0.5 text-[11px] text-destructive/80">
            {issue.reports} reports • {issue.note}
          </p>
        </div>
      </div>
    </section>
  )
}
