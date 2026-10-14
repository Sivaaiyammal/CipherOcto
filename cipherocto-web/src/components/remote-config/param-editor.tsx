import * as React from "react"

import { Field, SelectInput, TextInput, inputClass } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { PortfolioApp } from "@/data/apps"
import {
  CATEGORY_LABEL,
  KEY_RE,
  normalizeValue,
  TYPE_LABEL,
  validateValue,
  type ClientPlatform,
  type ParamCategory,
  type ParamType,
  type RemoteParam,
} from "@/data/remote-config"
import { cn } from "@/lib/utils"

type Form = {
  key: string
  type: ParamType
  category: ParamCategory
  tag: string
  description: string
  value: string
  defaultValue: string
  rollout: number
  platforms: ClientPlatform[]
  apps: string[]
}

const unquote = (type: ParamType, v: string) => (type === "string" && v.startsWith('"') ? JSON.parse(v) : v)

function toForm(p: RemoteParam | null): Form {
  if (!p) {
    return {
      key: "", type: "boolean", category: "feature", tag: "", description: "",
      value: "true", defaultValue: "false", rollout: 100, platforms: ["ios", "android"], apps: [],
    }
  }
  return {
    key: p.key,
    type: p.type,
    category: p.category,
    tag: p.tag ?? "",
    description: p.description,
    value: unquote(p.type, p.value),
    defaultValue: unquote(p.type, p.defaultValue),
    rollout: p.distribution.kind === "rollout" ? p.distribution.pct : 100,
    platforms: p.platforms,
    apps: p.apps,
  }
}

export function ParamEditor({
  open,
  onOpenChange,
  param,
  existingKeys,
  apps,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = create a new parameter */
  param: RemoteParam | null
  existingKeys: string[]
  apps: PortfolioApp[]
  onSave: (next: Omit<RemoteParam, "id" | "updatedAt" | "updatedBy" | "rules" | "enabled"> & { id?: string }) => void
}) {
  const [form, setForm] = React.useState<Form>(() => toForm(param))
  const [attempted, setAttempted] = React.useState(false)
  const editingRollout = !param || param.distribution.kind === "rollout"

  const errors: Record<string, string> = {}
  if (!KEY_RE.test(form.key)) errors.key = "Use snake_case: lowercase letters, digits and underscores (3–64 chars)."
  else if (existingKeys.includes(form.key) && form.key !== param?.key) errors.key = "A parameter with this key already exists."
  const valueErr = validateValue(form.type, form.value)
  if (valueErr) errors.value = valueErr
  const defErr = validateValue(form.type, form.defaultValue)
  if (defErr) errors.defaultValue = defErr
  if (!form.description.trim()) errors.description = "Describe what this parameter controls."
  if (form.platforms.length === 0) errors.platforms = "Select at least one client platform."
  const shown = attempted ? errors : {}

  const save = () => {
    setAttempted(true)
    if (Object.keys(errors).length) return
    onSave({
      id: param?.id,
      key: form.key,
      type: form.type,
      category: form.category,
      tag: form.tag.trim() || undefined,
      description: form.description.trim(),
      value: normalizeValue(form.type, form.value),
      defaultValue: normalizeValue(form.type, form.defaultValue),
      distribution: editingRollout ? { kind: "rollout", pct: form.rollout } : param!.distribution,
      chips: param?.chips ?? [],
      platforms: form.platforms,
      apps: form.apps,
    })
    onOpenChange(false)
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{param ? `Edit ${param.key}` : "New Parameter"}</SheetTitle>
          <SheetDescription>Changes are saved as a draft. Publish to push them to clients.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="rc-key" label="Parameter Key" required error={shown.key} hint="Clients read it with this exact key.">
            <TextInput id="rc-key" mono value={form.key} placeholder="enable_new_paywall" onChange={(e) => set("key", e.target.value.trim())} error={shown.key} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="rc-type" label="Type" required>
              <SelectInput
                id="rc-type"
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as ParamType
                  setForm((f) => ({
                    ...f,
                    type,
                    value: type === "boolean" ? "true" : type === "number" ? "0" : type === "json" ? "{}" : "",
                    defaultValue: type === "boolean" ? "false" : type === "number" ? "0" : type === "json" ? "{}" : "",
                  }))
                }}
                options={(Object.keys(TYPE_LABEL) as ParamType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
              />
            </Field>
            <Field id="rc-category" label="Category" required>
              <SelectInput
                id="rc-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value as ParamCategory)}
                options={(Object.keys(CATEGORY_LABEL) as ParamCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
              />
            </Field>
          </div>
          <Field id="rc-desc" label="Description" required error={shown.description}>
            <TextInput id="rc-desc" value={form.description} placeholder="What does this parameter control?" onChange={(e) => set("description", e.target.value)} error={shown.description} />
          </Field>
          <Field id="rc-tag" label="Tag" hint="Optional label, e.g. Core AI, Pricing.">
            <TextInput id="rc-tag" value={form.tag} onChange={(e) => set("tag", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {(["value", "defaultValue"] as const).map((k) => (
              <Field key={k} id={`rc-${k}`} label={k === "value" ? "Served Value" : "Default (fallback)"} required error={shown[k]} className={form.type === "json" ? "col-span-2" : undefined}>
                {form.type === "boolean" ? (
                  <SelectInput id={`rc-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} options={[{ value: "true" }, { value: "false" }]} />
                ) : form.type === "json" ? (
                  <textarea
                    id={`rc-${k}`}
                    rows={4}
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                    aria-invalid={!!shown[k]}
                    className={cn(inputClass, "h-auto py-2 font-mono text-[13px]")}
                  />
                ) : (
                  <TextInput id={`rc-${k}`} mono inputMode={form.type === "number" ? "decimal" : undefined} value={form[k]} onChange={(e) => set(k, e.target.value)} error={shown[k]} />
                )}
              </Field>
            ))}
          </div>

          {editingRollout ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px] font-semibold text-foreground">
                <label htmlFor="rc-rollout">Rollout</label>
                <span className="tabular-nums">{form.rollout}%</span>
              </div>
              <input
                id="rc-rollout"
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.rollout}
                onChange={(e) => set("rollout", Number(e.target.value))}
                className="w-full accent-[var(--stream-mrr)]"
              />
            </div>
          ) : (
            <p className="rounded-xl bg-background p-3 text-xs text-muted-foreground">
              This parameter uses a {param!.distribution.kind === "split" ? "variant split" : param!.distribution.kind} distribution; it's kept as is.
            </p>
          )}

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-foreground">Client Platforms</legend>
            <div className="flex gap-4">
              {(["ios", "android"] as const).map((pl) => (
                <label key={pl} className="flex items-center gap-2 text-[13px]">
                  <Checkbox
                    checked={form.platforms.includes(pl)}
                    onCheckedChange={(v) => set("platforms", v === true ? [...form.platforms, pl] : form.platforms.filter((x) => x !== pl))}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  {pl === "ios" ? "iOS" : "Android"}
                </label>
              ))}
            </div>
            {shown.platforms && <p className="mt-1 text-xs font-medium text-destructive">{shown.platforms}</p>}
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-foreground">App Scope</legend>
            <label className="mb-2 flex items-center gap-2 text-[13px]">
              <Checkbox
                checked={form.apps.length === 0}
                onCheckedChange={(v) => v === true && set("apps", [])}
                className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              All apps
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {apps.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-[13px] text-foreground">
                  <Checkbox
                    checked={form.apps.includes(a.id)}
                    onCheckedChange={(v) => set("apps", v === true ? [...form.apps, a.id] : form.apps.filter((x) => x !== a.id))}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <span className="truncate">{a.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{param ? "Save as Draft" : "Create Draft"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
