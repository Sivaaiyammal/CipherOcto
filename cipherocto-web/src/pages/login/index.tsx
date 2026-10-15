import * as React from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  RocketIcon,
  SlidersHorizontalIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"

import { CipherOctoLogo } from "@/components/cipherocto-logo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/data/auth-context"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    icon: SlidersHorizontalIcon,
    title: "Remote config without releases",
    text: "Ship flags, paywalls and kill switches to every app instantly.",
  },
  {
    icon: WalletIcon,
    title: "One ledger for every store",
    text: "App Store, Google Play and Stripe revenue reconciled daily.",
  },
  {
    icon: RocketIcon,
    title: "Staged rollouts, instant rollback",
    text: "Promote builds 10% → 100% with crash-rate auto-halt.",
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

type FieldErrors = { email?: string; password?: string; form?: string }

export default function LoginPage() {
  const { status, login, loginDemo, demo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [demoRole, setDemoRole] = React.useState("admin")
  const [year] = React.useState(() => new Date().getFullYear())

  if (status === "authenticated") return <Navigate to={from} replace />

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!email.trim()) next.email = "Enter your work email."
    else if (!EMAIL_RE.test(email.trim())) next.email = "That doesn't look like a valid email."
    if (!password) next.password = "Enter your password."
    return next
  }

  const message = (err: unknown) =>
    err instanceof ApiError ? err.message : "Something went wrong. Please try again."

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice(null)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await login(email.trim().toLowerCase(), password, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors({ form: message(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const signInAsDemo = async () => {
    setNotice(null)
    setErrors({})
    setSubmitting(true)
    try {
      await loginDemo(demoRole, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors({ form: message(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const ssoNotConnected = (provider: string) =>
    setNotice(`${provider} sign-in isn't connected yet — use your email and password for now.`)

  return (
    <div className="grid min-h-svh grid-cols-[minmax(0,1fr)] bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-mint/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-32 size-[30rem] rounded-full bg-tertiary/25 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <CipherOctoLogo className="bg-white/10" />
          <span className="text-[22px] font-bold tracking-[-0.02em]">CipherOcto</span>
          <span className="rounded-full bg-mint-border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-mint">
            PRO
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-11 font-bold tracking-[-0.025em]">
            One console for your entire app portfolio.
          </h2>
          <p className="mt-3 text-base text-primary-foreground/70">
            Revenue, releases, remote config and team operations for every
            app you ship — in one place.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-mint-border">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold">{title}</p>
                  <p className="text-sm text-primary-foreground/65">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-xs text-primary-foreground/60">
          <span>© {year} Octo Corp</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-mint-border" />
            All systems operational
          </span>
        </div>
      </aside>

      {/* Sign-in form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <CipherOctoLogo className="bg-primary" />
            <span className="text-xl font-bold tracking-[-0.02em] text-foreground">CipherOcto</span>
          </div>

          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your CipherOcto workspace.
          </p>

          {demo.enabled && (
            <>
            <div className="mt-7 flex items-center gap-2 text-[13px]">
              <label htmlFor="demo-role" className="shrink-0 font-semibold text-foreground">
                Demo as
              </label>
              <select
                id="demo-role"
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-2 text-[13px] outline-none focus:ring-2 focus:ring-ring/20"
              >
                {demo.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void signInAsDemo()}
              disabled={submitting}
              className="group mt-2 flex w-full items-center gap-3 rounded-xl border border-mint-border bg-mint-surface p-3 text-left transition-colors hover:bg-mint-hover disabled:pointer-events-none disabled:opacity-70"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-stream-mrr text-white">
                {submitting ? <Loader2Icon className="size-5 animate-spin" /> : <ZapIcon className="size-5" />}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-sm font-bold text-mint">One-click demo login</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Explore the workspace with this role's permissions
                </span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-mint transition-transform group-hover:translate-x-0.5" />
            </button>
            </>
          )}

          <div className={cn("grid grid-cols-2 gap-2.5", demo.enabled ? "mt-4" : "mt-7")}>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[10px] bg-card text-[13px] font-semibold"
              onClick={() => ssoNotConnected("Google")}
            >
              <GoogleMark />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[10px] bg-card text-[13px] font-semibold"
              onClick={() => ssoNotConnected("SAML SSO")}
            >
              <KeyRoundIcon />
              SSO
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-subtle-foreground">
            <span className="h-px flex-1 bg-border" />
            or sign in with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-11 rounded-[10px] bg-card px-3.5 text-sm"
              />
              {errors.email && (
                <p id="email-error" className="text-xs font-medium text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-semibold">
                  Password
                </Label>
                <a href="#" className="text-xs font-semibold text-mint hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="h-11 rounded-[10px] bg-card pr-11 pl-3.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-medium text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              Keep me signed in for 30 days
            </label>

            {errors.form && (
              <p role="alert" className="rounded-[10px] bg-pink-surface px-3 py-2 text-xs font-medium text-destructive">
                {errors.form}
              </p>
            )}

            {notice && (
              <p role="status" className="rounded-[10px] bg-amber-surface px-3 py-2 text-xs font-medium text-amber">
                {notice}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className={cn("mt-1 h-11 rounded-[10px] text-sm font-semibold", submitting && "opacity-90")}
            >
              {submitting ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Don&apos;t have access?{" "}
            <a href="#" className="font-semibold text-foreground hover:underline">
              Request an invite
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
