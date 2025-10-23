"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { getPlaceHighlights } from "@/components/PlaceHighlights";
import { Button } from "@/components/ui/button";
import { PlaceContent } from "@/components/PlaceContent";
import {
    FC,
    useRef,
    useEffect
} from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PlaceModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, open, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const highlights = place ? getPlaceHighlights(place) : null;

    useEffect(() => {
        // Scroll to the top when the modal opens
        if (contentRef.current && open && place) {
            contentRef.current.scrollTop = 0;
        }
    }, [open, place]);

    if (!open || !place) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={isMobile ? contentRef : undefined}
                crossCloseIconSize="h-7 w-7"
                className={cn(
                    "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg",
                    // Apply centralized gradient (featured/openingSoon) if provided
                    highlights?.gradients.modal,
                    isMobile
                        ? "w-full max-h-[86dvh] overflow-y-auto"
                        : "w-auto max-w-2xl mx-auto rounded-xl max-h-[95dvh] overflow-hidden flex flex-col"
                )}
                onOpenAutoFocus={(e) => {
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                {highlights?.ribbon && (
                    <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                        <div className={cn(
                            "absolute top-4 -left-16 w-[200px] flex justify-center items-center text-white font-semibold py-2.5 transform rotate-[-45deg] shadow-lg",
                            highlights.ribbon.bgClass,
                            // Preserve original font sizing: featured was text-sm, opening soon text-xs
                            highlights.ribbon.label === 'Opening Soon' ? 'text-xs' : 'text-sm'
                        )}>
                            {highlights.ribbon.icon}
                            <span>{highlights.ribbon.label}</span>
                        </div>
                    </div>
                )}

                <DialogHeader className="mt-7 sm:mt-0 shrink-0">
                    <DialogTitle className="text-center">
                        {place.name}
                    </DialogTitle>
                    <DialogDescription className="text-center">{place.type.join(", ")}</DialogDescription>
                </DialogHeader>

                {/* Body: desktop pins footer by making only this part scroll; mobile lets outer scroll */}
                {isMobile ? (
                    <PlaceContent place={place} layout="modal" />
                ) : (
                    <div ref={contentRef} className="flex-1 overflow-y-auto">
                        <PlaceContent place={place} layout="modal" />
                    </div>
                )}

                <div className="flex justify-center py-4 px-4 mt-auto shrink-0">
                    <Button className="font-bold w-full max-w-xs" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
