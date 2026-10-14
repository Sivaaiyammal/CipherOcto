import { cn } from "@/lib/utils"

export function CipherOctoLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-sidebar-accent",
        className
      )}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <path d="M8 15.5a8 8 0 0 1 16 0V18H8z" fill="#22d3ee" />
        <g
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M9.5 17.5c0 4-3 4-3 6.5" />
          <path d="M13 18c0 4-1.5 5-1.5 7.5" />
          <path d="M19 18c0 4 1.5 5 1.5 7.5" />
          <path d="M22.5 17.5c0 4 3 4 3 6.5" />
        </g>
        <circle cx="13" cy="13.5" r="1.9" fill="#0f172a" />
        <circle cx="19" cy="13.5" r="1.9" fill="#0f172a" />
        <circle cx="13.6" cy="12.9" r="0.6" fill="#ffffff" />
        <circle cx="19.6" cy="12.9" r="0.6" fill="#ffffff" />
      </svg>
    </span>
  )
}
