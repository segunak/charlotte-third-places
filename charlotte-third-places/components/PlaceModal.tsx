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

interface PlaceModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, open, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);

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
                ref={contentRef}
                crossCloseIconSize="h-7 w-7"
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-2xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                {/* Featured ribbon, corner banner */}
                {place.featured && (
                    <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                        <div className="absolute top-4 -left-16 w-[200px] flex justify-center items-center bg-amber-500 text-white text-sm font-semibold py-2.5 transform rotate-[-45deg] shadow-lg">
                            <Icons.star className="h-4 w-4 mr-1" />
                            <span>Featured</span>
                        </div>
                    </div>
                )}

                <DialogHeader className="mt-7 sm:mt-0">
                    <DialogTitle className="text-center">
                        {place.name}
                    </DialogTitle>
                    <DialogDescription className="text-center">{place.type.join(", ")}</DialogDescription>
                </DialogHeader>

                <PlaceContent
                    place={place}
                    layout="modal"
                />

                {/* CLOSE BUTTON */}
                <div className="flex justify-center py-4 px-4 mt-auto">
                    <Button className="font-bold w-full max-w-xs" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
