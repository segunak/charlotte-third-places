"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
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
    const isOpeningSoon = place?.operational === "Opening Soon";

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
                    // Base positioning and shared styles
                    "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg",
                    // Apply Opening Soon stripe styling similar to PlaceCard (kept subtle)
                    isOpeningSoon && "border-2 border-blue-200 overflow-hidden bg-[repeating-linear-gradient(45deg,rgba(56,189,248,0.12)_0px,rgba(56,189,248,0.12)_14px,rgba(255,255,255,0)_14px,rgba(255,255,255,0)_36px)] dark:bg-[repeating-linear-gradient(45deg,rgba(71,85,105,0.35)_0px,rgba(71,85,105,0.35)_14px,rgba(30,41,59,0)_14px,rgba(30,41,59,0)_36px)]",
                    // Branch-specific sizing/rounding and scroll behavior
                    isMobile
                        ? "w-full max-h-[86dvh] overflow-y-auto"
                        : "w-auto max-w-3xl mx-auto rounded-xl max-h-[95dvh] overflow-hidden flex flex-col"
                )}
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                {(() => {
                    // Determine which ribbon to show based on priority
                    if (place.featured) {
                        return (
                            <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                                <div className="absolute top-4 -left-16 w-[200px] flex justify-center items-center bg-amber-500 text-white text-sm font-semibold py-2.5 transform rotate-[-45deg] shadow-lg">
                                    <Icons.star className="h-4 w-4 mr-1" />
                                    <span>Featured</span>
                                </div>
                            </div>
                        );
                    } else if (place.operational === "Opening Soon") {
                        return (
                            <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                                <div className="absolute top-4 -left-16 w-[200px] flex justify-center items-center bg-blue-500 text-white text-xs font-semibold py-2.5 transform rotate-[-45deg] shadow-lg">
                                    <span>Opening Soon</span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

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
