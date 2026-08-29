import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FilterFieldsetProps {
    active?: boolean;
    children: ReactNode;
    label: string;
    labelId?: string;
    selectionCount?: number;
}

export function FilterFieldset({
    active = false,
    children,
    label,
    labelId,
    selectionCount = 0,
}: FilterFieldsetProps) {
    const ruleClassName = active ? "bg-primary/40" : "bg-border/70";

    return (
        <fieldset className="w-full min-w-0 border-0 bg-transparent p-0">
            <legend id={labelId} className="w-full p-0">
                <span className="flex w-full items-center gap-2">
                    <span aria-hidden="true" className={cn("h-px min-w-0 flex-1", ruleClassName)} />
                    <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        {selectionCount > 0 && (
                            <span
                                role="status"
                                aria-label={`${selectionCount} selected`}
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none tabular-nums text-primary-foreground"
                            >
                                {selectionCount}
                            </span>
                        )}
                    </span>
                    <span aria-hidden="true" className={cn("h-px min-w-0 flex-1", ruleClassName)} />
                </span>
            </legend>
            <div className="mt-1">{children}</div>
        </fieldset>
    );
}
