import * as React from "react"
import { ShieldCheckIcon } from "lucide-react"

import { Field, SelectInput, TextInput } from "@/components/register/fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { APP_SCOPES, ROLES, roleOf, type AppScopeId, type Invite, type Member, type RoleId, type Scope } from "@/data/team"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLE_OPTIONS = ROLES.map((r) => ({ value: r.id, label: r.label }))
const APP_IDS = Object.keys(APP_SCOPES) as AppScopeId[]

function ScopePicker({ value, onChange, error }: { value: Scope; onChange: (s: Scope) => void; error?: string }) {
  const all = value === "all"
  return (
    <fieldset className="space-y-2">
      <legend className="text-[13px] font-semibold text-foreground">App portfolio scope</legend>
      <div role="radiogroup" className="flex gap-2">
        {[
          { v: true, label: "All apps (8)" },
          { v: false, label: "Selected apps" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={all === o.v}
            onClick={() => onChange(o.v ? "all" : all ? ["habitocto"] : value)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${all === o.v ? "bg-primary text-primary-foreground" : "bg-foreground/[0.05] text-muted-foreground hover:text-foreground"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {!all && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {APP_IDS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-[13px]">
              <Checkbox
                checked={(value as AppScopeId[]).includes(a)}
                onCheckedChange={(c) => {
                  const cur = value as AppScopeId[]
                  onChange(c === true ? [...cur, a] : cur.filter((x) => x !== a))
                }}
                className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              {APP_SCOPES[a]}
            </label>
          ))}
        </div>
      )}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </fieldset>
  )
}

export function InviteSheet({
  open,
  onOpenChange,
  existingEmails,
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingEmails: string[]
  onSend: (i: Omit<Invite, "id" | "sentMin" | "expiresDays">) => void
}) {
  const [email, setEmail] = React.useState("")
  const [roleId, setRoleId] = React.useState<RoleId>("dev")
  const [scope, setScope] = React.useState<Scope>("all")
  const [attempted, setAttempted] = React.useState(false)

  const clean = email.trim().toLowerCase()
  const errors: { email?: string; scope?: string } = {}
  if (!EMAIL_RE.test(clean)) errors.email = "Enter a valid email address."
  else if (existingEmails.includes(clean)) errors.email = "That person is already a member or has a pending invite."
  if (scope !== "all" && scope.length === 0) errors.scope = "Pick at least one app."
  const shown = attempted ? errors : {}

  const send = () => {
    setAttempted(true)
    if (errors.email || errors.scope) return
    onSend({ email: clean, roleId, scope })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Invite New Team Member</SheetTitle>
          <SheetDescription>Send an invitation link with scoped access.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="invite-email" label="Corporate Email Address" required error={shown.email}>
            <TextInput id="invite-email" type="email" value={email} placeholder="colleague@octocorp.internal" onChange={(e) => setEmail(e.target.value)} error={shown.email} />
          </Field>
          <Field id="invite-role" label="Primary Role">
            <SelectInput id="invite-role" value={roleId} onChange={(e) => setRoleId(e.target.value as RoleId)} options={ROLE_OPTIONS} />
          </Field>
          <p className="rounded-lg bg-background p-3 text-xs text-muted-foreground">{roleOf(roleId).description}</p>
          <ScopePicker value={scope} onChange={setScope} error={shown.scope} />
          <div className="space-y-1 rounded-xl bg-mint-surface p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-mint">
              <ShieldCheckIcon className="size-4" />
              Zero-Trust 2FA Enforcement
            </p>
            <p className="text-xs text-muted-foreground">
              Invited users will be required to register a WebAuthn / FIDO2 hardware authenticator upon initial SSO sign-in.
            </p>
          </div>
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={send}>Send Invitation Link</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function MemberSheet({
  open,
  onOpenChange,
  member,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSave: (id: string, patch: { roleId: RoleId; scope: Scope }) => void
}) {
  const [roleId, setRoleId] = React.useState<RoleId>(member?.roleId ?? "dev")
  const [scope, setScope] = React.useState<Scope>(member?.scope ?? "all")
  const invalid = scope !== "all" && scope.length === 0

  if (!member) return null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Edit permissions</SheetTitle>
          <SheetDescription>
            {member.name} · {member.email}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field id="member-role" label="Primary Role">
            <SelectInput id="member-role" value={roleId} onChange={(e) => setRoleId(e.target.value as RoleId)} options={ROLE_OPTIONS} />
          </Field>
          <p className="rounded-lg bg-background p-3 text-xs text-muted-foreground">{roleOf(roleId).description}</p>
          <ScopePicker value={scope} onChange={setScope} error={invalid ? "Pick at least one app." : undefined} />
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalid}
            onClick={() => {
              onSave(member.id, { roleId, scope })
              onOpenChange(false)
            }}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
