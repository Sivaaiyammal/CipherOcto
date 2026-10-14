import * as React from "react"
import { CheckIcon, Loader2Icon, TerminalIcon } from "lucide-react"

import { Field, inputClass, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SIMULATED_EVENTS, type StoreEventType } from "@/data/subscriptions"
import { cn } from "@/lib/utils"

const USER_ID_RE = /^usr_[a-z0-9]{3,24}$/i

export function SandboxSimulator({ onSimulate }: { onSimulate: (type: StoreEventType, userId: string) => void }) {
  const [userId, setUserId] = React.useState("")
  const [type, setType] = React.useState<StoreEventType>("DID_RENEW")
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  React.useEffect(() => {
    if (!sent) return
    const t = window.setTimeout(() => setSent(false), 1800)
    return () => window.clearTimeout(t)
  }, [sent])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!USER_ID_RE.test(userId.trim())) {
      setError("Use a sandbox user ID like usr_9x8f.")
      return
    }
    setError(null)
    onSimulate(type, userId.trim())
    setSent(true)
  }

  return (
    <section className="flex flex-col justify-between gap-4 rounded-xl bg-neutral-strong p-4 shadow-[var(--shadow-1)] @4xl/main:flex-row @4xl/main:items-center">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TerminalIcon className="size-5" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-foreground">StoreKit 2 &amp; Google Billing Sandbox Simulator</p>
          <p className="text-xs text-muted-foreground">
            Emulate renewal, failure, expiry or refund events into the staging feed — nothing is sent to the stores.
          </p>
        </div>
      </div>
      <form onSubmit={submit} noValidate className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-nowrap">
        <div className="w-full sm:w-48">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID e.g., usr_9x8f"
            aria-label="Sandbox user ID"
            aria-invalid={!!error}
            className={cn(inputClass, "h-8 bg-card text-[13px]")}
          />
          {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as StoreEventType)} aria-label="Event type" className={cn(inputClass, "h-8 w-auto bg-card text-[13px]")}>
          {SIMULATED_EVENTS.map((ev) => (
            <option key={ev.value} value={ev.value}>
              {ev.label}
            </option>
          ))}
        </select>
        <button type="submit" className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold whitespace-nowrap text-primary-foreground hover:bg-primary/85">
          {sent ? <CheckIcon className="size-4 text-mint-border" /> : null}
          {sent ? "Event Sent" : "Simulate Event"}
        </button>
      </form>
    </section>
  )
}

type Decoded = { label: string; value: string }[]

/** Simulated receipt validation until the App Store Server API is connected. */
export function TestReceiptSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [input, setInput] = React.useState("")
  const [state, setState] = React.useState<"idle" | "checking" | "done">("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [decoded, setDecoded] = React.useState<Decoded>([])

  const check = () => {
    const v = input.trim()
    const isJws = v.split(".").length === 3 && v.length > 40
    const isTxn = /^\d{12,20}$/.test(v)
    const isPlayToken = /^[a-z]{24}\./i.test(v) || (v.length > 60 && !isJws)
    if (!isJws && !isTxn && !isPlayToken) {
      setError("Paste an App Store transaction ID (digits), a signed JWS, or a Google Play purchase token.")
      return
    }
    setError(null)
    setState("checking")
    window.setTimeout(() => {
      setDecoded([
        { label: "Source", value: isTxn || isJws ? "App Store (Sandbox)" : "Google Play (Test track)" },
        { label: "Format", value: isJws ? "JWS signedTransactionInfo" : isTxn ? "originalTransactionId" : "purchaseToken" },
        { label: "Product", value: "com.octo.habits.pro.annual" },
        { label: "Status", value: "Active · auto-renew on" },
        { label: "Expires", value: new Date(Date.now() + 365 * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ])
      setState("done")
    }, 900)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Test Receipt</SheetTitle>
          <SheetDescription>Validate a sandbox purchase. Results are simulated until the store APIs are connected.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <Field id="receipt" label="Transaction ID, JWS or purchase token" error={error ?? undefined}>
            <TextInput id="receipt" mono value={input} onChange={(e) => setInput(e.target.value)} placeholder="2000000412345678" error={error ?? undefined} />
          </Field>
          <Button onClick={check} disabled={state === "checking"} className="w-full">
            {state === "checking" && <Loader2Icon className="animate-spin" />}
            {state === "checking" ? "Validating…" : "Validate Receipt"}
          </Button>
          {state === "done" && (
            <dl className="space-y-1.5 rounded-xl bg-mint-surface p-3 text-[13px]">
              {decoded.map((d) => (
                <div key={d.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="text-right font-semibold text-foreground">{d.value}</dd>
                </div>
              ))}
              <p className="pt-1 text-[11px] font-bold tracking-[0.04em] text-mint uppercase">Simulated result</p>
            </dl>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
