import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/SiteHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { ThemeProvider } from "@/components/ThemeProvider"
import { GoogleTagManager } from '@next/third-parties/google'
import { MobileNavigation } from "@/components/MobileNavigation"
import { TailwindIndicator } from "@/components/TailwindIndicator"
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

export const metadata: Metadata = {
  title: {
    default: "Charlotte Third Places",
    template: `%s - Charlotte Third Places`,
  },
  description: "A curated collection of third places in Charlotte, North Carolina",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <GoogleTagManager gtmId="G-CDFREVMH8F" />
      <body
        className={cn(
          "min-h-dvh bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader />
          <div className="flex flex-col min-h-dvh">
            <div className="flex-1 mb-12 sm:mb-0">
              {children}
              <ScrollToTopButton />
            </div>
            <MobileNavigation />
            <SiteFooter />
          </div>
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}
