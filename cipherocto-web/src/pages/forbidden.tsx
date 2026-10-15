import { Link } from "react-router-dom"
import { ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/data/auth-context"

export default function ForbiddenPage() {
  const { user } = useAuth()
  return (
    <div className="px-4 lg:px-6">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-pink-hover text-pink">
          <ShieldAlertIcon className="size-6" />
        </span>
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-foreground">You don&apos;t have access to this page</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {user ? `Your role (${user.role.label}) doesn't include this area.` : "Your role doesn't include this area."} Ask a workspace admin if
          you think you should have it.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
