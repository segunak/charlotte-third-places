"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface FilterChipProps extends Omit<ComponentProps<typeof Button>, "variant"> {
    selected?: boolean;
    padding?: string;
}

export function FilterChip({
    selected,
    padding = "px-2.5",
    className,
    ...props
}: FilterChipProps) {
    return (
        <Button
            type="button"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            className={cn(
                "h-9 shrink-0 rounded-full text-sm font-medium",
                padding,
                className
            )}
            {...props}
        />
    );
}