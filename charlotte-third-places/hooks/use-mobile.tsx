import * as React from "react"

/**
 * Tailwind's md: breakpoint. Screens >= this value are desktop.
 * Mobile is defined as width < DESKTOP_BREAKPOINT.
 * @see https://tailwindcss.com/docs/responsive-design#overview
 */
const DESKTOP_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized.
 * 
 * PERFORMANCE NOTE: Defaults to `false` (desktop) instead of `undefined` to prevent
 * double-mount renders. Every component using this hook would otherwise render twice:
 * once with undefined → false, then again after useEffect sets the actual value.
 * 
 * Defaulting to desktop is safer because:
 * - Desktop renders are typically heavier (more visible cards, larger layouts)
 * - Mobile users briefly seeing desktop layout is less jarring than vice versa
 * - SSR/hydration mismatch is avoided since server also defaults to false
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(width < ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
