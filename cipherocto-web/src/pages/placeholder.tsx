import { useLocation } from "react-router-dom"
import { ConstructionIcon } from "lucide-react"

import { findNavItem } from "@/lib/navigation"

export default function PlaceholderPage() {
  const { pathname } = useLocation()
  const item = findNavItem(pathname)

  return (
    <div className="px-4 lg:px-6">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-neutral-strong text-foreground">
          <ConstructionIcon className="size-6" />
        </span>
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-foreground">
          {item?.pageTitle ?? item?.title ?? "Page not found"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {item
            ? "This module is coming soon."
            : "The page you are looking for does not exist."}
        </p>
      </div>
    </div>
  )
}
