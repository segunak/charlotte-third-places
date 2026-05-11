import { withSerwist } from "@serwist/turbopack";
import { withVercelToolbar } from '@vercel/toolbar/plugins/next';

/** @type {import('next').NextConfig} */

const disableImageOptimization = true;

const nextConfig = {
    reactCompiler: true, // Enable React Compiler for automatic memoization
    async redirects() {
        return [
            // Canonicalize apex -> www, but exempt /.well-known/* so Android
            // deep link verification (assetlinks.json) and other protocol
            // files are fetchable at the apex without redirect. Google's
            // verifier refuses to follow redirects when checking assetlinks.
            {
                source: '/:path((?!\\.well-known/).*)',
                has: [{ type: 'host', value: 'charlottethirdplaces.com' }],
                destination: 'https://www.charlottethirdplaces.com/:path',
                permanent: true,
            },
            { source: '/privacy', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=4af666ad-5f20-42ae-96d3-0b587717c6f6', permanent: false },
            { source: '/cookies', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=1416a187-4ce6-4e4b-abdd-39c1cb4f7671', permanent: false },
            { source: '/terms', destination: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=354be667-fbde-479e-a4b9-1a3b261ef0ed', permanent: false },
        ];
    },
    images: {
        unoptimized: disableImageOptimization,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'thirdplacesdata.blob.core.windows.net',
                port: '',
                pathname: '/**',
                search: '',
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [48, 64, 96, 128, 256],
        qualities: [40, 75, 80],
        formats: ['image/webp'], // Enable WebP for better compression
        minimumCacheTTL: 2678400, // Cache images for 31 days, the maximum allowed by Vercel's Image Optimization per https://vercel.com/docs/image-optimization/managing-image-optimization-costs
        maximumRedirects: 0,
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
