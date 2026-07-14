"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

interface LinkedImageModalProps {
    src: string;
    open: boolean;
    onClose: () => void;
}

export function LinkedImageModal({ src, open, onClose }: LinkedImageModalProps) {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent
                className="flex h-[90dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden border-white/15 bg-black p-0 sm:h-[92dvh] sm:w-[calc(100vw-2rem)]"
                crossCloseClassName="z-10 bg-black/60 p-2 text-white opacity-100 hover:bg-black/80"
                crossCloseIconColor="text-white"
                crossCloseIconSize="h-6 w-6"
                overlayStyle={{ zIndex: 100 }}
                style={{ zIndex: 101 }}
                aria-describedby="linked-image-description"
            >
                <DialogTitle className="sr-only">Image Preview</DialogTitle>
                <DialogDescription id="linked-image-description" className="sr-only">
                    Preview of the linked image
                </DialogDescription>

                <div className="flex min-h-0 grow items-center justify-center p-2 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt="Linked image"
                        className="block max-h-full max-w-full object-contain"
                        decoding="async"
                    />
                </div>

                <div className="shrink-0 border-t border-white/15 bg-black/90 p-4 text-center">
                    <Button
                        type="button"
                        className="h-11 w-full text-base sm:w-52"
                        onClick={onClose}
                        aria-label="Close image preview"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
