import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react"
import { SiteHeader } from "@/components/SiteHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleTagManager } from '@next/third-parties/google'
import { MobileNavigation } from "@/components/MobileNavigation"
import { TailwindIndicator } from "@/components/TailwindIndicator"

export const metadata: Metadata = {
  creator: 'Segun Akinyemi',
  authors: [{ name: 'Segun Akinyemi', url: 'https://segunakinyemi.com' }],
  title: {
    default: "Charlotte Third Places",
    template: `%s | Charlotte Third Places`,
  },
  description: "A curated collection of third places in Charlotte, North Carolina",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: 'https://charlottethirdplaces.com',
  },
  openGraph: {
    title: "Charlotte Third Places",
    description: "A curated collection of third places in Charlotte, North Carolina",
    url: "https://charlottethirdplaces.com",
    siteName: "Charlotte Third Places",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Charlotte Third Places",
    description: "A curated collection of third places in Charlotte, North Carolina",
    creator: "@segunofsolace",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    title: "Charlotte Third Places",
    statusBarStyle: "default",
  },
  metadataBase: new URL('https://charlottethirdplaces.com'),
  keywords: ['Charlotte, NC', 'Charlotte, North Carolina', 'Charlotte Third Places', 'third places', 'community spaces', 'cafes', 'coffee shops', 'coffee shops in Charlotte', 'remote work', 'work remotely'],
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
          <div className="flex flex-col min-h-dvh">
            <SiteHeader />
            <main className="flex-1 mb-12 sm:mb-0 bg-background">
              {children}
            </main>
            <MobileNavigation />
            <SiteFooter />
          </div>
          <TailwindIndicator />
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
