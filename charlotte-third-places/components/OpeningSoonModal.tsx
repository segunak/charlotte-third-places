"use client";

import { Place } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlaceCard } from "@/components/PlaceCard";

interface OpeningSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  places: Place[];
}

/**
 * Presents a lightweight list of Opening Soon places separate from the main browse list.
 * Uses a Sheet on mobile (bottom drawer) and a Dialog on larger screens for familiarity.
 */
export function OpeningSoonModal({ open, onOpenChange, places }: OpeningSoonModalProps) {
  const isMobile = useIsMobile();

  // Guard: never render empty state modal – parent should hide trigger if none.
  if (places.length === 0) return null;

  const content = (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1 sm:px-2" role="list">
      {places.map(p => (
        <div key={p.recordId} role="listitem" className="first:mt-1">
          <PlaceCard place={p} />
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          crossCloseIconSize="h-7 w-7"
          className="w-full max-h-[85dvh] overflow-y-auto flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}
          // Let default focus handling occur (usually close button) without forcing focus on title.
          onOpenAutoFocus={(e) => { e.preventDefault(); }}
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>Opening Soon</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1">{content}</div>
          <div className="p-4 pt-2 shrink-0">
            <Button className="w-full font-bold" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg w-auto max-w-2xl mx-auto rounded-xl max-h-[95dvh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Opening Soon</DialogTitle>
        </DialogHeader>
        <div className="flex-1">{content}</div>
        <div className="pt-2 pb-4 px-4 shrink-0">
          <Button className="w-full font-bold" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
