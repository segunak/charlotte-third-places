import { withVercelToolbar } from '@vercel/toolbar/plugins/next';

/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "**", // Allow all hostnames for remote images
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'], // Enable WebP for better compression
        minimumCacheTTL: 604800, // Cache images for 7 days
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

export default withVercelToolbar()(nextConfig);
