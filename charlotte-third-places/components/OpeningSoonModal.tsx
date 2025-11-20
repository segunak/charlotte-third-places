"use client";

import { Place } from "@/lib/types";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlaceCard } from "@/components/PlaceCard";

interface OpeningSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  places: Place[];
}

export function OpeningSoonModal({ open, onOpenChange, places }: OpeningSoonModalProps) {
  const isMobile = useIsMobile();
  
  // Build list content only when open and there are places; memoized to avoid re-mapping on unrelated renders.
  const content = useMemo(() => {
    if (!open || places.length === 0) return null;
    return (
      <div className="space-y-4 overflow-y-auto px-1 sm:px-2" role="list">
        {places.map(p => (
          <div key={p.recordId} role="listitem" className="first:mt-1">
            <PlaceCard place={p} />
          </div>
        ))}
      </div>
    );
  }, [open, places]);

  // After hooks: if no places, render nothing.
  if (places.length === 0) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="overflow-hidden flex flex-col pb-safe"
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DrawerHeader className="mt-2 mb-2">
            <DrawerTitle>Opening Soon</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-2 -mt-1">{content}</div>
          <DrawerFooter>
            <Button className="w-full font-bold" onClick={() => onOpenChange(false)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg w-auto max-w-xl mx-auto rounded-xl max-h-[95dvh] overflow-hidden flex flex-col"
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
