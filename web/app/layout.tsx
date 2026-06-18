import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { fontSans, fontCard } from "@/lib/fonts"
import { Analytics } from "@vercel/analytics/react"
import { SiteHeader } from "@/components/SiteHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { VercelToolbar } from '@vercel/toolbar/next'
import { ModalProvider } from "@/contexts/ModalContext";
import { ThemeProvider } from "@/components/ThemeProvider"
import { ThemeColorSync } from "@/components/ThemeColorSync"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleTagManager } from '@next/third-parties/google'
import { MobileNavigation } from "@/components/MobileNavigation"
import { TailwindIndicator } from "@/components/TailwindIndicator"
import { SerwistProvider } from "@/app/serwist-provider"

export const metadata: Metadata = {
  applicationName: 'Charlotte Third Places',
  creator: 'Segun Akinyemi',
  authors: [{ name: 'Segun Akinyemi', url: 'https://segunakinyemi.com' }],
  title: {
    default: "Charlotte Third Places",
    template: `%s | Charlotte Third Places`,
  },
  description: "A curated collection of third places in Charlotte, North Carolina",
  icons: {
    icon: [
      { url: '/favicons/favicon.ico' },
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/favicons/apple-touch-icon.png',
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
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://charlottethirdplaces.com'),
  category: 'lifestyle',
  appLinks: {
    ios: { url: 'https://charlottethirdplaces.com', app_store_id: '6762573563' },
    android: { package: 'com.charlottethirdplaces.app', app_name: 'Charlotte Third Places' },
    web: { url: 'https://charlottethirdplaces.com', should_fallback: true },
  },
  keywords: ['Charlotte, NC', 'Charlotte, North Carolina', 'Charlotte Third Places', 'Charlotte Third Spaces', 'third places', 'third spaces', 'community spaces', 'cafes', 'coffee shops', 'coffee shops in Charlotte', 'remote work', 'work remotely', 'Charlotte black-owned businesses', 'Charlotte cafes', 'family-owned cafes in Charlotte', 'work-friendly cafes Charlotte', 'third places in Charlotte', 'third spaces in Charlotte', 'community gathering spaces Charlotte', 'remote work cafes Charlotte', 'places to work remotely in Charlotte', 'Charlotte NC community spaces', 'local cafes in Charlotte', 'Charlotte coffee shop recommendations', 'best places for coffee in Charlotte', 'coffee shop with free WiFi Charlotte', 'black-owned cafes Charlotte', 'cafe with pastries Charlotte', 'Fort Mill cafes', 'best coffee shops in Fort Mill', 'remote work spaces in Fort Mill', 'Ballantyne coffee shops', 'family-owned cafes Ballantyne', 'Concord coffee shops', 'remote work cafes Concord', 'third places in Concord', 'third spaces in Concord', 'Rock Hill coffee shops', 'third places in Rock Hill', 'third spaces in Rock Hill', 'Belmont cafes', 'remote work spaces Belmont', 'third places in Belmont', 'third spaces in Belmont', 'Kannapolis cafes', 'community spaces in Kannapolis', 'third places in Kannapolis', 'third spaces in Kannapolis', 'Matthews cafes', 'family-friendly cafes Matthews', 'top coffee shops in Ballantyne', 'quiet cafes for working in Charlotte', 'best cafes for studying in Charlotte', 'Charlotte coworking cafes', 'hidden gem coffee shops Charlotte', 'outdoor seating cafes Charlotte', 'local favorite coffee shops Charlotte', 'coffee shops with parking in Charlotte', 'Charlotte study spots', 'best places to work in Charlotte', 'Fort Mill community spaces', 'coffee shops open late in Charlotte', 'Ballantyne community gathering spaces', 'local coffee culture Charlotte', 'best cafes in Charlotte for meetings', 'Uptown Charlotte coffee spots', 'black-owned coffee shops in Charlotte', 'local Charlotte businesses', 'Fort Mill gathering spaces', 'Kannapolis third places', 'Kannapolis third spaces', 'Belmont third places', 'Belmont third spaces', 'coffee shops near me Charlotte', 'Matthews community gathering spots', 'remote work spots Fort Mill', 'best cafes to work remotely in Rock Hill', 'outdoor cafes in Belmont', 'remote work spaces in Matthews', 'best breakfast cafes in Charlotte', 'free WiFi coffee shops in Fort Mill', 'Kannapolis study spots', 'pet-friendly cafes Charlotte', 'Charlotte coffee shops with vegan options', 'laptop-friendly cafes in Charlotte', 'family-friendly coffee shops Charlotte', 'Charlotte neighborhood cafes', 'Queen City Quarter cafes', 'coffee shops with meeting rooms Charlotte']
}

interface RootLayoutProps {
  children: React.ReactNode
}

export const viewport: Viewport = {
  // Matches --background in light mode (hsl(190 60% 97%)). The ThemeColorSync
  // client component updates this at runtime when the user toggles dark mode.
  themeColor: '#F3FAFC',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: RootLayoutProps) {
  const shouldInjectToolbar = process.env.NODE_ENV === 'development';
  // Vercel auto-injects VERCEL_ENV ("production" | "preview" | "development").
  // Preview deployments sit behind deployment protection; the browser's service
  // worker fetch can't carry the bypass header, so registration fails with a
  // 401 noise console error. Suppress SW registration on preview only —
  // production keeps the service worker.
  const disableServiceWorker = process.env.VERCEL_ENV === 'preview';
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.className}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-itunes-app" content="app-id=6762573563" />
        {/*
          Sets data-native-app on <html> before first paint when the user is inside
          the iOS WKWebView wrapper (detected via the "app-platform" cookie set by
          the Swift wrapper) or an iOS Safari home-screen PWA (navigator.standalone).
          Combined with the `.hide-in-native-app` CSS rule in globals.css, this prevents
          a flash of "Get the App" promotional UI inside native apps. Android TWAs and
          installed PWAs are handled purely via `display-mode: standalone` in CSS.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie||"";var s=window.navigator&&window.navigator.standalone===true;if(c.indexOf("app-platform")!==-1||s){document.documentElement.setAttribute("data-native-app","true");}}catch(e){}})();`,
          }}
        />
      </head>
      <GoogleTagManager gtmId="GTM-KFSPZP5P" />
      <body
        className={cn(
          "min-h-dvh bg-background antialiased",
          fontSans.variable,
          fontCard.variable
        )}
      >
        <SerwistProvider swUrl="/serwist/sw.js" disable={disableServiceWorker}>
          <ThemeProvider>
            <ThemeColorSync />
            <ModalProvider>
              <div className="flex flex-col min-h-dvh">
                <SiteHeader />
                <main className="flex-1 bg-background">
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
        </SerwistProvider>
        {shouldInjectToolbar && <VercelToolbar />}
      </body>
    </html>
  );
}
