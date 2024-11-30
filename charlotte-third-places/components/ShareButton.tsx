"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
    url: string;
    placeName: string;
    size?: 'sm' | 'default' | 'lg';
    className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ url, placeName, size = "default", className }) => {
    const handleShare = async () => {
        const shareData = {
            title: placeName,
            text: `Charlotte Third Places: ${placeName}`,
            url: url,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Successfully shared');
            } catch (error) {
                console.error('Error sharing', error);
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
        <Button size={size} className={cn(className)} onClick={handleShare}>
            Share
        </Button>
    );
};
