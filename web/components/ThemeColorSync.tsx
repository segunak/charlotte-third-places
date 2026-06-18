"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

// Keep these in sync with --background in styles/globals.css
// Light: hsl(190 60% 97%) ≈ #F3FAFC
// Dark:  hsl(190 50% 9%)  ≈ #0B1F22
const LIGHT_BG = "#F3FAFC"
const DARK_BG = "#0B1F22"

/**
 * Keeps the <meta name="theme-color"> tag in sync with the active theme so
 * that native WebView wrappers (iOS WKWebView via adaptiveUIStyle, Android
 * TWA) tint the status bar area to match the page background instead of the
 * brand/primary color.
 */
export function ThemeColorSync() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const color = resolvedTheme === "dark" ? DARK_BG : LIGHT_BG
        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        if (meta) {
            meta.setAttribute("content", color)
        } else {
            const created = document.createElement("meta")
            created.name = "theme-color"
            created.content = color
            document.head.appendChild(created)
        }
    }, [resolvedTheme])

    return null
}
