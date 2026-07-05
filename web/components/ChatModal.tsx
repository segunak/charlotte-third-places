"use client"

import { ChatContent } from "@/components/ChatContent"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Place } from "@/lib/types"

interface ChatModalProps {
    open: boolean
    onClose: () => void
    place?: Place | null  // Optional place context for place-specific chats
    initialMessage?: string // Optional initial message to send
    /**
     * Stacking z-index for this modal surface. Applied as inline style to both
     * the overlay and content so it overrides any class-based z. Higher values
     * stack above lower ones.
     */
    zIndex?: number
}

export function ChatModal({ open, onClose, place, initialMessage, zIndex }: ChatModalProps) {
    const isMobile = useIsMobile()

    const title = place ? `${place.name}` : "Ask about Charlotte Third Places"
    const description = place
        ? "Ask AI about this place"
        : "Ask me anything about third places in Charlotte"

    const zStyle = zIndex !== undefined ? { zIndex } : undefined

    // Mobile: Full-screen drawer from bottom
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()} repositionInputs={false}>
                <DrawerContent
                    className="h-[95dvh] pb-safe"
                    style={zStyle}
                    overlayStyle={zStyle}
                >
                    <DrawerHeader className="shrink-0 py-2 mt-4">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription className="text-xs">
                            {description}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-hidden">
                        <ChatContent
                            place={place}
                            initialMessage={initialMessage}
                            variant="dialog"
                        />
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    // Desktop: Dialog
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className="sm:max-w-2xl h-[95dvh] flex flex-col p-0 gap-0"
                style={zStyle}
                overlayStyle={zStyle}
                crossCloseIconSize="h-7 w-7"
                crossCloseIconColor="text-black dark:text-white"
            >
                <DialogHeader className="p-4 pb-2 mt-7 shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-sm">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <ChatContent
                        place={place}
                        initialMessage={initialMessage}
                        variant="dialog"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
