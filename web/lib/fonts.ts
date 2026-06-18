import { Inter, JetBrains_Mono, IBM_Plex_Sans } from 'next/font/google'

// Inter is the primary sitewide sans-serif font (self-hosted via next/font).
export const fontSans = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap',
})

// JetBrains Mono is available wherever a monospaced font is needed.
export const fontMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
})

// Dedicated card font (IBM Plex Sans) used only on place cards for subtle typographic contrast.
export const fontCard = IBM_Plex_Sans({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-card',
    display: 'swap',
})
