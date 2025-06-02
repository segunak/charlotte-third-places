import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SiteHeader } from "@/components/SiteHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { VercelToolbar } from '@vercel/toolbar/next'
import { ModalProvider } from "@/contexts/ModalContext";
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
  keywords: ['Charlotte, NC', 'Charlotte, North Carolina', 'Charlotte Third Places', 'Charlotte Third Spaces', 'third places', 'third spaces', 'community spaces', 'cafes', 'coffee shops', 'coffee shops in Charlotte', 'remote work', 'work remotely', 'Charlotte black-owned businesses', 'Charlotte cafes', 'family-owned cafes in Charlotte', 'work-friendly cafes Charlotte', 'third places in Charlotte', 'third spaces in Charlotte', 'community gathering spaces Charlotte', 'remote work cafes Charlotte', 'places to work remotely in Charlotte', 'Charlotte NC community spaces', 'local cafes in Charlotte', 'Charlotte coffee shop recommendations', 'best places for coffee in Charlotte', 'coffee shop with free WiFi Charlotte', 'black-owned cafes Charlotte', 'cafe with pastries Charlotte', 'Fort Mill cafes', 'best coffee shops in Fort Mill', 'remote work spaces in Fort Mill', 'Ballantyne coffee shops', 'family-owned cafes Ballantyne', 'Concord coffee shops', 'remote work cafes Concord', 'third places in Concord', 'third spaces in Concord', 'Rock Hill coffee shops', 'third places in Rock Hill', 'third spaces in Rock Hill', 'Belmont cafes', 'remote work spaces Belmont', 'third places in Belmont', 'third spaces in Belmont', 'Kannapolis cafes', 'community spaces in Kannapolis', 'third places in Kannapolis', 'third spaces in Kannapolis', 'Matthews cafes', 'family-friendly cafes Matthews', 'top coffee shops in Ballantyne', 'quiet cafes for working in Charlotte', 'best cafes for studying in Charlotte', 'Charlotte coworking cafes', 'hidden gem coffee shops Charlotte', 'outdoor seating cafes Charlotte', 'local favorite coffee shops Charlotte', 'coffee shops with parking in Charlotte', 'Charlotte study spots', 'best places to work in Charlotte', 'Fort Mill community spaces', 'coffee shops open late in Charlotte', 'Ballantyne community gathering spaces', 'local coffee culture Charlotte', 'best cafes in Charlotte for meetings', 'Uptown Charlotte coffee spots', 'black-owned coffee shops in Charlotte', 'local Charlotte businesses', 'Fort Mill gathering spaces', 'Kannapolis third places', 'Kannapolis third spaces', 'Belmont third places', 'Belmont third spaces', 'coffee shops near me Charlotte', 'Matthews community gathering spots', 'remote work spots Fort Mill', 'best cafes to work remotely in Rock Hill', 'outdoor cafes in Belmont', 'remote work spaces in Matthews', 'best breakfast cafes in Charlotte', 'free WiFi coffee shops in Fort Mill', 'Kannapolis study spots', 'pet-friendly cafes Charlotte', 'Charlotte coffee shops with vegan options', 'laptop-friendly cafes in Charlotte', 'family-friendly coffee shops Charlotte', 'Charlotte neighborhood cafes', 'Queen City Quarter cafes', 'coffee shops with meeting rooms Charlotte']
}

interface RootLayoutProps {
  children: React.ReactNode
}

export const viewport: Viewport = {
  themeColor: 'white',
}

export default function RootLayout({ children }: RootLayoutProps) {
  const shouldInjectToolbar = process.env.NODE_ENV === 'development';
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.className}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <GoogleTagManager gtmId="GTM-KFSPZP5P" />
      <body
        className={cn(
          "min-h-dvh bg-background antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <ModalProvider>
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
          </ModalProvider>
        </ThemeProvider>
        {shouldInjectToolbar && <VercelToolbar />}
      </body>
    </html>
  );
}
