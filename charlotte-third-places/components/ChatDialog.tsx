"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Place } from "@/lib/types"
import { ChatContent } from "@/components/ChatContent"

interface ChatDialogProps {
    open: boolean
    onClose: () => void
    place?: Place | null  // Optional place context for place-specific chats
    initialMessage?: string // Optional initial message to send
}

export function ChatDialog({ open, onClose, place, initialMessage }: ChatDialogProps) {
    const isMobile = useIsMobile()

    const title = place ? `${place.name}` : "Ask about Charlotte Third Places"
    const description = place
        ? "Ask AI about this place"
        : "Ask me anything about third places in Charlotte"

    // Mobile: Full-screen drawer from bottom
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()} repositionInputs={false}>
                <DrawerContent className="h-[80dvh] pb-safe">
                    <DrawerHeader className="shrink-0 py-2">
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
                className="sm:max-w-2xl h-[90vh] max-h-[600px] flex flex-col p-0 gap-0"
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
