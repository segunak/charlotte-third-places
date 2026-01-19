"use client";

import { Place } from "@/lib/types";
import { getPlaceHighlights } from "@/components/PlaceHighlights";
import { Button } from "@/components/ui/button";
import { PlaceContent } from "@/components/PlaceContent";
import { ChatDialog } from "@/components/ChatDialog";
import { Icons } from "@/components/Icons";
import {
    FC,
    useRef,
    useEffect,
    useState
} from "react";
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
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        // Scroll to the top when the modal opens
        if (contentRef.current && open && place) {
            contentRef.current.scrollTop = 0;
        }
        // Reset chat when modal closes
        if (!open) {
            setShowChat(false);
        }
    }, [open, place]);

    if (!open || !place) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent
                    crossCloseIconSize="h-7 w-7"
                    crossCloseIconColor="text-black dark:text-white"
                    className={cn(
                        "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg",
                        // Apply centralized gradient (featured/openingSoon) if provided
                        highlights?.gradients.modal,
                        isMobile
                            ? "w-full max-h-[95dvh] overflow-hidden flex flex-col"
                            : "w-auto max-w-xl mx-auto rounded-xl max-h-[95dvh] overflow-hidden flex flex-col"
                    )}
                    onOpenAutoFocus={(e) => {
                        if (contentRef.current) {
                            contentRef.current.scrollTop = 0;
                        }
                        e.preventDefault();
                    }}
                >
                    {/* Diagonal ribbon */}
                    {highlights?.ribbon && (
                        <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                            <div className={cn(
                                "absolute top-4 -left-16 w-[200px] flex justify-center items-center text-white font-semibold py-2.5 transform -rotate-45 shadow-lg",
                                highlights.ribbon.bgClass,
                                highlights.ribbon.label === 'Opening Soon' ? 'text-xs' : 'text-sm'
                            )}>
                                {highlights.ribbon.icon}
                                <span>{highlights.ribbon.label}</span>
                            </div>
                        </div>
                    )}

                    <DialogHeader className="mt-7 sm:mt-0 shrink-0">
                        <DialogTitle className={cn(
                            "text-center",
                            highlights?.ribbon && "px-8 sm:px-0"
                        )}>
                            {place.name}
                        </DialogTitle>
                        <DialogDescription className="text-center">{place.type.join(", ")}</DialogDescription>
                    </DialogHeader>

                    {/* Body: scrollable content area, footer stays fixed */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0">
                        <PlaceContent place={place} layout="modal" />
                    </div>

                    <div className="px-6 py-4 border-t mt-auto shrink-0 flex justify-center gap-3">
                        {place.operational !== "Opening Soon" && (
                            <Button
                                className="h-11 text-base flex-1"
                                onClick={() => setShowChat(true)}
                            >
                                <Icons.chat className="h-4 w-4 mr-2" />
                                Ask AI
                            </Button>
                        )}
                        <Button 
                            className={cn(
                                "h-11 text-base",
                                place.operational === "Opening Soon" ? "w-full" : "flex-1"
                            )} 
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Chat Dialog */}
            <ChatDialog
                open={showChat}
                onClose={() => setShowChat(false)}
                place={place}
            />
        </>
    );
};
