import { withSerwist } from "@serwist/turbopack";
import { withVercelToolbar } from '@vercel/toolbar/plugins/next';

/** @type {import('next').NextConfig} */

const nextConfig = {
    reactCompiler: true, // Enable React Compiler for automatic memoization
    async redirects() {
        return [
            { source: '/privacy', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=4af666ad-5f20-42ae-96d3-0b587717c6f6', permanent: false },
            { source: '/cookies', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=1416a187-4ce6-4e4b-abdd-39c1cb4f7671', permanent: false },
            { source: '/terms', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=354be667-fbde-479e-a4b9-1a3b261ef0ed', permanent: false },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "**", // Allow all hostnames for remote images
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        qualities: [40, 75, 80],
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

export default withSerwist(withVercelToolbar()(nextConfig));
