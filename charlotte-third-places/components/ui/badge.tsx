import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        "default-no-hover": "border-transparent bg-primary text-primary-foreground shadow",
        "secondary-no-hover": "border-transparent bg-secondary text-secondary-foreground",
        "destructive-no-hover": "border-transparent bg-destructive text-destructive-foreground shadow",
        "outline-no-hover": "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  disableHover?: boolean;
}

function Badge({ className, variant, disableHover, ...props }: BadgeProps) {
  // Map variant to no-hover variant when disableHover is true
  const effectiveVariant = disableHover ?
    (
      variant === "default" ? "default-no-hover" :
        variant === "secondary" ? "secondary-no-hover" :
          variant === "destructive" ? "destructive-no-hover" :
            variant === "outline" ? "outline-no-hover" :
              "default-no-hover"
    ) : variant;

  return (
    <div className={cn(badgeVariants({ variant: effectiveVariant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
