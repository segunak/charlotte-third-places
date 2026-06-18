import * as React from "react"

import { cn } from "@/lib/utils"

const Card = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-slot="card"
  className={cn(
    "rounded-xl border bg-card text-card-foreground shadow-sm",
    className
  )}
  {...props}
/>)

const CardHeader = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-slot="card-header"
  className={cn("flex flex-col space-y-1.5 p-6", className)}
  {...props}
/>)

const CardTitle = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-slot="card-title"
  className={cn("font-semibold leading-none tracking-tight", className)}
  {...props}
/>)

const CardDescription = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-slot="card-description"
  className={cn("text-sm text-muted-foreground", className)}
  {...props}
/>)

const CardContent = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div ref={ref} data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />)

const CardFooter = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-slot="card-footer"
  className={cn("flex items-center p-6 pt-0", className)}
  {...props}
/>)

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
