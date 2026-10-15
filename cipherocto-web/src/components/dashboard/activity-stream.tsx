import * as React from "react"
import {
  BadgeCheckIcon,
  HistoryIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  TagIcon,
  ToggleRightIcon,
  UserRoundIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import { auditApi, type AuditEvent } from "@/lib/audit-api"
import { cn } from "@/lib/utils"

type Row = { icon: React.ReactNode; tone: string; message: React.ReactNode }

const code = (text: string) => (
  <code className="inline-block rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] break-all">{text}</code>
)

const MINT = "bg-mint-hover text-mint"
const SOFT = "bg-stream-iap-soft text-foreground/80"
const STONE = "bg-neutral-strong text-foreground"

function who(e: AuditEvent) {
  return <strong className="font-semibold">{e.actorEmail ?? "System"}</strong>
}

/** Turns an audit event into a row in the stream's existing visual language. */
function describe(e: AuditEvent): Row {
  const target = e.target ? code(e.target) : null
  switch (e.action) {
    case "app.created":
      return { icon: <BadgeCheckIcon />, tone: MINT, message: <>App {target} registered by {who(e)}</> }
    case "app.updated":
      return { icon: <ToggleRightIcon />, tone: STONE, message: <>App {target} updated by {who(e)}</> }
    case "app.sdk_key_created":
      return { icon: <KeyRoundIcon />, tone: SOFT, message: <>SDK key created for {target} by {who(e)}</> }
    case "app.sdk_key_revoked":
      return { icon: <KeyRoundIcon />, tone: STONE, message: <>SDK key revoked for {target} by {who(e)}</> }
    case "app.privacy_policy_published":
      return { icon: <ShieldCheckIcon />, tone: MINT, message: <>Privacy policy published for {target} by {who(e)}</> }
    default:
      if (e.action.startsWith("subscription") || e.action.startsWith("product")) {
        return { icon: <TagIcon />, tone: SOFT, message: <>{e.action.replaceAll("_", " ")} {target} by {who(e)}</> }
      }
      if (e.action.startsWith("user") || e.action.startsWith("auth") || e.action.startsWith("role")) {
        return { icon: <UserRoundIcon />, tone: STONE, message: <>{e.action.replaceAll(".", " · ").replaceAll("_", " ")} {target} by {who(e)}</> }
      }
      return { icon: <HistoryIcon />, tone: STONE, message: <>{e.action.replaceAll(".", " · ").replaceAll("_", " ")} {target} by {who(e)}</> }
  }
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return "just now"
  if (abs < 3600) return RELATIVE.format(Math.round(seconds / 60), "minute")
  if (abs < 86_400) return RELATIVE.format(Math.round(seconds / 3600), "hour")
  return RELATIVE.format(Math.round(seconds / 86_400), "day")
}

export function ActivityStream() {
  const { can } = useAuth()
  const allowed = can("audit:read")

  const [events, setEvents] = React.useState<AuditEvent[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!allowed) return
    const ctrl = new AbortController()
    auditApi
      .recent(6, ctrl.signal)
      .then((list) => {
        setEvents(list)
        setError(null)
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof ApiError ? e.message : "Couldn't load activity.")
      })
    return () => ctrl.abort()
  }, [allowed, tick])

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

      {!allowed ? (
        <p className="text-xs text-muted-foreground">Your role can&apos;t view the audit log.</p>
      ) : error ? (
        <div role="alert" className="flex items-center gap-2 text-xs text-destructive">
          <span className="flex-1">{error}</span>
          <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>
            Retry
          </Button>
        </div>
      ) : events === null ? (
        <p className="text-xs text-muted-foreground">Loading activity…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {events.map((event) => {
            const item = describe(event)
            return (
              <li key={event.id} className="flex gap-3">
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(event.at)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
