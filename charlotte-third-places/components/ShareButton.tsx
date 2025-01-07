"use client";

import React from "react";
import { Icons } from "@/components/Icons";
import { Button, ButtonProps } from "@/components/ui/button";

interface ShareButtonProps extends ButtonProps {
    url: string;
    placeName?: string;
    displayType?: "text" | "icon";
}

export const ShareButton = React.forwardRef<HTMLButtonElement, ShareButtonProps>(
    ({ url, placeName, displayType = "text", variant = "default", size = "default", ...props }, ref) => {
        const handleShare = async () => {
            const shareData = {
                title: placeName || "",
                text: placeName ? `Charlotte Third Places: ${placeName}` : "",
                url,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    console.log("Successfully shared");
                } catch (error) {
                    console.error("Error sharing", error);
                }
            } else {
                // Fallback to copying the link to the clipboard
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    alert("Link copied to clipboard!");
                } catch (error) {
                    console.error("Failed to copy the link to clipboard", error);
                }
            }
        };

        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                onClick={handleShare}
                {...props}
            >
                {displayType === "icon" ? (
                    <Icons.share className="h-6 w-6 text-primary" aria-label="Share" />
                ) : (
                    "Share"
                )}
            </Button>
        );
    }
);

ShareButton.displayName = "ShareButton";
