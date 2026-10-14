import * as React from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon, UploadIcon } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function SectionCard({
  step,
  title,
  description,
  aside,
  children,
  className,
}: {
  step?: number | string
  title: string
  description?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-6 rounded-2xl bg-card p-6 shadow-[var(--shadow-1)]", className)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          {step !== undefined && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-sm font-bold text-foreground">
              {step}
            </span>
          )}
          <div>
            <h2 className="text-lg leading-[26px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
            {description && <p className="text-[13px] leading-[18px] text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  )
}

export function Pill({
  tone = "muted",
  children,
  className,
}: {
  tone?: "muted" | "mint" | "blue" | "solid-mint"
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]",
        tone === "muted" && "bg-foreground/[0.05] text-muted-foreground",
        tone === "mint" && "bg-mint-border/70 text-mint",
        tone === "blue" && "bg-blue-hover text-tertiary",
        tone === "solid-mint" && "bg-stream-mrr text-white",
        className
      )}
    >
      {children}
    </span>
  )
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  id: string
  label: string
  required?: boolean
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold tracking-[0.01em] text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export const inputClass =
  "h-10 w-full rounded-lg bg-background px-3.5 text-sm text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none transition-shadow placeholder:text-subtle-foreground focus:bg-card focus:shadow-[inset_0_0_0_1px_var(--primary),0_0_0_3px_rgba(15,23,42,0.08)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--destructive)]"

export function TextInput({
  error,
  mono,
  className,
  ...props
}: React.ComponentProps<"input"> & { error?: string; mono?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : undefined}
      className={cn(inputClass, mono && "font-mono text-[13px]", className)}
    />
  )
}

export function SelectInput({
  options,
  className,
  ...props
}: React.ComponentProps<"select"> & { options: { value: string; label?: string }[] }) {
  return (
    <div className="relative">
      <select {...props} className={cn(inputClass, "cursor-pointer appearance-none pr-9", className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label ?? o.value}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function ToggleRow({
  id,
  title,
  badge,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  title: string
  badge?: React.ReactNode
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-background p-4">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
            {title}
          </label>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-neutral-deep"
      />
    </div>
  )
}

export function PlatformCard({
  icon,
  iconClass,
  title,
  subtitle,
  enabled,
  onEnabledChange,
  statusLabel,
  children,
}: {
  icon: React.ReactNode
  iconClass: string
  title: string
  subtitle: string
  enabled: boolean
  /** Omit for always-on cards (no switch is rendered). */
  onEnabledChange?: (v: boolean) => void
  statusLabel: string
  children: React.ReactNode
}) {
  const id = `toggle-${title.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-1)] ring-1 ring-border/60 transition-shadow hover:shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-between gap-3 bg-background/70 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-[18px]", iconClass)}>
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {onEnabledChange ? (
                <label htmlFor={id} className="text-base font-semibold text-foreground">
                  {title}
                </label>
              ) : (
                <span className="text-base font-semibold text-foreground">{title}</span>
              )}
              <Pill tone={enabled ? "mint" : "muted"}>{enabled ? statusLabel : "Disabled"}</Pill>
            </div>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {onEnabledChange && (
          <Switch
            id={id}
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-neutral-deep"
          />
        )}
      </div>
      {enabled && <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">{children}</div>}
    </div>
  )
}

export function CopyBox({ label, value, help }: { label: React.ReactNode; value: string; help?: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(t)
  }, [copied])

  return (
    <div className="space-y-1.5 rounded-xl bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => setCopied(true), () => setCopied(false))
          }}
          className="flex items-center gap-1 text-[11px] font-bold tracking-[0.04em] text-mint hover:underline"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
      <div className="rounded-lg bg-card p-2.5 font-mono text-xs break-all text-foreground shadow-[inset_0_0_0_1px_var(--border)] select-all">
        {value}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}

/** File picker that only reports the chosen file; contents are handled by the caller. */
export function FileDrop({
  id,
  accept,
  icon,
  title,
  detail,
  buttonLabel,
  error,
  onFile,
}: {
  id: string
  accept: string
  icon: React.ReactNode
  title: string
  detail: React.ReactNode
  buttonLabel: string
  error?: string
  onFile: (file: File) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) onFile(file)
        }}
        className={cn(
          "flex flex-col items-center justify-between gap-4 rounded-xl bg-background p-4 transition-colors sm:flex-row",
          dragging && "bg-mint-surface ring-2 ring-mint-border",
          error && "ring-1 ring-destructive/60"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-mint shadow-[var(--shadow-1)] [&_svg]:size-5">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>
            <p className="text-xs break-all text-muted-foreground">{detail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-card px-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-1)] hover:bg-foreground/[0.04]"
        >
          <UploadIcon className="size-4" />
          {buttonLabel}
        </button>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ""
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
