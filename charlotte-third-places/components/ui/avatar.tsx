"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    ref?: React.Ref<React.ComponentRef<typeof AvatarPrimitive.Root>>;
  }
) => (<AvatarPrimitive.Root
  ref={ref}
  data-slot="avatar"
  className={cn(
    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
    className
  )}
  {...props}
/>)

const AvatarImage = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    ref?: React.Ref<React.ComponentRef<typeof AvatarPrimitive.Image>>;
  }
) => (<AvatarPrimitive.Image
  ref={ref}
  data-slot="avatar-image"
  className={cn("aspect-square h-full w-full", className)}
  {...props}
/>)

const AvatarFallback = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    ref?: React.Ref<React.ComponentRef<typeof AvatarPrimitive.Fallback>>;
  }
) => (<AvatarPrimitive.Fallback
  ref={ref}
  data-slot="avatar-fallback"
  className={cn(
    "flex h-full w-full items-center justify-center rounded-full bg-muted",
    className
  )}
  {...props}
/>)

export { Avatar, AvatarImage, AvatarFallback }
