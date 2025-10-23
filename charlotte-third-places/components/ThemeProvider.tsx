import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

// We explicitly disable system theme detection so users CANNOT land in dark mode
// unless they have previously toggled it via the UI (which stores the value).
// Only 'light' and 'dark' themes are allowed; 'system' is intentionally excluded.
// If no stored preference exists, the site always renders in light mode.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
