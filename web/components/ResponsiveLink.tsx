"use client";

import { LinkedImageModal } from "@/components/LinkedImageModal";
import { cn } from "@/lib/utils";
import {
    useEffect,
    useState,
    type AnchorHTMLAttributes,
    type MouseEvent,
} from "react";

const IMAGE_FILE_PATTERN = /\.(?:apng|avif|bmp|cur|gif|heic|heif|ico|jpe?g|jfif|jxl|png|svg|tiff?|webp)$/i;

function isImageHref(href: string): boolean {
    try {
        const url = new URL(href, "https://www.charlottethirdplaces.com");
        return (url.protocol === "http:" || url.protocol === "https:")
            && IMAGE_FILE_PATTERN.test(url.pathname);
    } catch {
        return false;
    }
}

export function ResponsiveLink({
    href,
    children,
    className = "",
    applyDefaultStyling = true,
    onClick,
    rel,
    target,
    ...props
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
    applyDefaultStyling?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
    const [isDesktop, setIsDesktop] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const imageHref = isImageHref(href);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (
            event.defaultPrevented
            || !imageHref
            || event.button !== 0
            || event.metaKey
            || event.ctrlKey
            || event.shiftKey
            || event.altKey
        ) {
            return;
        }

        event.preventDefault();
        setIsImageOpen(true);
    };

    return (
        <>
            <a
                href={href}
                target={target ?? (imageHref || isDesktop ? "_blank" : "_self")}
                rel={rel ?? "noopener"}
                className={cn(applyDefaultStyling ? "custom-link" : "", className)}
                onClick={handleClick}
                {...props}
            >
                {children}
            </a>
            {imageHref && (
                <LinkedImageModal
                    src={href}
                    open={isImageOpen}
                    onClose={() => setIsImageOpen(false)}
                />
            )}
        </>
    );
}
