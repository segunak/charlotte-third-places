"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { useOpenNow } from "@/contexts/FilterContext";

export function MobileMapOpenNow() {
    const { openNow, setOpenNow, openNowCount } = useOpenNow();

    return (
        <Button
            onClick={() => setOpenNow(!openNow)}
            aria-pressed={openNow}
            className={openNow
                ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 font-extrabold flex items-center gap-1.5 shadow-lg rounded-sm"
                : "bg-primary hover:bg-primary/90 text-white font-extrabold flex items-center gap-1.5 shadow-lg rounded-sm"
            }
            size="sm"
        >
            <Icons.clock className={`w-4 h-4 shrink-0 ${openNow ? 'text-emerald-600' : 'text-white'}`} />
            <span>Open Now ({openNowCount})</span>
        </Button>
    );
}
