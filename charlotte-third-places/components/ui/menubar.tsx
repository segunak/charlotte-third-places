"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Root>>;
  }
) => (<MenubarPrimitive.Root
  ref={ref}
  data-slot="menubar"
  className={cn(
    "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
    className
  )}
  {...props}
/>)

const MenubarTrigger = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Trigger>>;
  }
) => (<MenubarPrimitive.Trigger
  ref={ref}
  data-slot="menubar-trigger"
  className={cn(
    "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
    className
  )}
  {...props}
/>)

const MenubarSubTrigger = (
  {
    ref,
    className,
    inset,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.SubTrigger>>;
    inset?: boolean;
  }
) => (<MenubarPrimitive.SubTrigger
  ref={ref}
  data-slot="menubar-sub-trigger"
  className={cn(
    "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
    inset && "pl-8",
    className
  )}
  {...props}
>
  {children}
  <ChevronRight className="ml-auto h-4 w-4" />
</MenubarPrimitive.SubTrigger>)

const MenubarSubContent = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.SubContent>>;
  }
) => (<MenubarPrimitive.SubContent
  ref={ref}
  data-slot="menubar-sub-content"
  className={cn(
    "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
    className
  )}
  {...props}
/>)

const MenubarContent = (
  {
    ref,
    className,
    align = "start",
    alignOffset = -4,
    sideOffset = 8,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Content>>;
  }
) => (<MenubarPrimitive.Portal>
  <MenubarPrimitive.Content
    ref={ref}
    data-slot="menubar-content"
    align={align}
    alignOffset={alignOffset}
    sideOffset={sideOffset}
    className={cn(
      "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
      className
    )}
    {...props}
  />
</MenubarPrimitive.Portal>)

const MenubarItem = (
  {
    ref,
    className,
    inset,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Item>>;
    inset?: boolean;
  }
) => (<MenubarPrimitive.Item
  ref={ref}
  data-slot="menubar-item"
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    inset && "pl-8",
    className
  )}
  {...props}
/>)

const MenubarCheckboxItem = (
  {
    ref,
    className,
    children,
    checked,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.CheckboxItem>>;
  }
) => (<MenubarPrimitive.CheckboxItem
  ref={ref}
  data-slot="menubar-checkbox-item"
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
  checked={checked}
  {...props}
>
  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
    <MenubarPrimitive.ItemIndicator>
      <Check className="h-4 w-4" />
    </MenubarPrimitive.ItemIndicator>
  </span>
  {children}
</MenubarPrimitive.CheckboxItem>)

const MenubarRadioItem = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.RadioItem>>;
  }
) => (<MenubarPrimitive.RadioItem
  ref={ref}
  data-slot="menubar-radio-item"
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
  {...props}
>
  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
    <MenubarPrimitive.ItemIndicator>
      <Circle className="h-4 w-4 fill-current" />
    </MenubarPrimitive.ItemIndicator>
  </span>
  {children}
</MenubarPrimitive.RadioItem>)

const MenubarLabel = (
  {
    ref,
    className,
    inset,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Label>>;
    inset?: boolean;
  }
) => (<MenubarPrimitive.Label
  ref={ref}
  data-slot="menubar-label"
  className={cn(
    "px-2 py-1.5 text-sm font-semibold",
    inset && "pl-8",
    className
  )}
  {...props}
/>)

const MenubarSeparator = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator> & {
    ref?: React.Ref<React.ComponentRef<typeof MenubarPrimitive.Separator>>;
  }
) => (<MenubarPrimitive.Separator
  ref={ref}
  data-slot="menubar-separator"
  className={cn("-mx-1 my-1 h-px bg-muted", className)}
  {...props}
/>)

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
