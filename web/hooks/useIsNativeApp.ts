"use client"

import { useEffect, useState } from "react"

/**
 * Detects whether the app is running inside a native wrapper (iOS WKWebView, Android TWA, or installed PWA).
 * Used to hide promotional UI (e.g. "Get the App" badges) and adjust padding for native safe areas.
 */
export function useIsNativeApp(): boolean {
    const [isNativeApp, setIsNativeApp] = useState(false)

    useEffect(() => {
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        const isIOSApp = document.cookie.includes("app-platform")
        const isAndroidTWA = document.referrer.includes("android-app://")
        const isSafariStandalone = (window.navigator as unknown as Record<string, unknown>).standalone === true
        setIsNativeApp(isStandalone || isIOSApp || isAndroidTWA || isSafariStandalone)
    }, [])

    return isNativeApp
}
