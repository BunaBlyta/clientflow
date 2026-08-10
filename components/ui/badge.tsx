import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Reserved for status flags that genuinely need a scannable badge (invoice
// state, project stage) — see AGENTS.md section 5. Don't reach for this as
// the default treatment for every label; prefer plain text + color first.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground border-transparent",
        outline: "border-border text-foreground bg-transparent",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        destructive: "bg-red-50 text-red-700 border-red-200",
        accent: "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
