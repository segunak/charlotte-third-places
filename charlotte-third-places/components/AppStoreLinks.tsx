"use client"

import { Icons } from "@/components/Icons"
import { useIsNativeApp } from "@/hooks/useIsNativeApp"

const APP_STORE_URL = "https://apps.apple.com/app/id6762573563"
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.charlottethirdplaces.app"

interface AppStoreLinksProps {
    className?: string
}

export function AppStoreLinks({ className }: AppStoreLinksProps) {
    const isNativeApp = useIsNativeApp()

    // Don't show app store links inside the native apps
    if (isNativeApp) return null

    const hasCustomLayout = Boolean(className)
    const anchorClass = hasCustomLayout ? "block w-full" : undefined
    const badgeClass = hasCustomLayout ? "w-full h-auto" : "h-10 w-auto sm:h-12"

    return (
        <div className={className ?? "flex flex-wrap items-center justify-center gap-4"}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={anchorClass}>
                <Icons.appleAppStoreBadge className={`${badgeClass} text-secondary`} />
            </a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={anchorClass}>
                <Icons.googlePlayStoreBadge className={`${badgeClass} text-primary`} />
            </a>
        </div>
    )
}
