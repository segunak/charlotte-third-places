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
                crossCloseIconSize="h-6 w-6"
                crossCloseIconColor={place.featured ? "text-gray-900" : undefined}
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-2xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                {/* Premium Modal Header */}
                {place.featured && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-3 text-center font-semibold text-lg flex items-center justify-center gap-1.5 -mx-6 -mt-6 mb-1 rounded-t-xl">
                        <Icons.star className="h-5 w-5" />
                        Featured Third Place
                        <Icons.star className="h-5 w-5" />
                    </div>
                )}

                <DialogHeader className={place.featured ? "mt-0" : "mt-7 sm:mt-0"}>
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
