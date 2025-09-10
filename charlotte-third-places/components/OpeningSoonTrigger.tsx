"use client";

import { Place } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OpeningSoonModal } from "@/components/OpeningSoonModal";

interface OpeningSoonTriggerProps {
  places: Place[]; // pre-filtered opening soon places
}

/**
 * Renders a subtle button that opens the Opening Soon modal.
 * Positioned where parent decides; keeps its own open state for isolation.
 */
export function OpeningSoonTrigger({ places }: OpeningSoonTriggerProps) {
  const [open, setOpen] = useState(false);
  if (!places.length) return null;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full justify-center mt-3 h-9 text-sm font-medium relative group"
      >
        <span className="flex items-center gap-2">
          <span>Opening Soon</span>
          <span className="inline-flex items-center justify-center min-w-[1.65rem] h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-2 shadow-sm">
            {places.length}
          </span>
        </span>
      </Button>
      <OpeningSoonModal open={open} onOpenChange={setOpen} places={places} />
    </>
  );
}
