"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = (
  {
    ref,
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    ref?: React.Ref<React.ComponentRef<typeof SeparatorPrimitive.Root>>;
  }
) => (<SeparatorPrimitive.Root
  ref={ref}
  data-slot="separator"
  decorative={decorative}
  orientation={orientation}
  className={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
    className
  )}
  {...props}
/>)

export { Separator }
