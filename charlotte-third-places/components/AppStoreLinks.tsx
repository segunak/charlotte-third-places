"use client"

import { useEffect, useState } from "react"
import { Icons } from "@/components/Icons"

const APP_STORE_URL = "https://apps.apple.com/app/id6762573563"
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.charlottethirdplaces.app"

interface AppStoreLinksProps {
    className?: string
}

export function AppStoreLinks({ className }: AppStoreLinksProps) {
    const [isNativeApp, setIsNativeApp] = useState(false)

    useEffect(() => {
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        const isIOSApp = document.cookie.includes("app-platform")
        const isAndroidTWA = document.referrer.includes("android-app://")
        const isSafariStandalone = (window.navigator as unknown as Record<string, unknown>).standalone === true
        setIsNativeApp(isStandalone || isIOSApp || isAndroidTWA || isSafariStandalone)
    }, [])

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
