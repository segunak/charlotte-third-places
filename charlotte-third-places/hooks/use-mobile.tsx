import * as React from "react"

const MOBILE_BREAKPOINT = 768

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
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
