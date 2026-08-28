import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FilterFieldsetProps {
    active?: boolean;
    children: ReactNode;
    label: string;
    labelId?: string;
}

export function FilterFieldset({
    active = false,
    children,
    label,
    labelId,
}: FilterFieldsetProps) {
    const ruleClassName = active ? "bg-primary/40" : "bg-border/70";

    return (
        <fieldset className="w-full min-w-0 border-0 bg-transparent p-0">
            <legend id={labelId} className="w-full p-0">
                <span className="flex w-full items-center gap-2">
                    <span aria-hidden="true" className={cn("h-px min-w-0 flex-1", ruleClassName)} />
                    <span className="shrink-0 text-sm font-semibold text-foreground">{label}</span>
                    <span aria-hidden="true" className={cn("h-px min-w-0 flex-1", ruleClassName)} />
                </span>
            </legend>
            <div className="mt-1">{children}</div>
        </fieldset>
    );
}
