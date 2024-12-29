/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'], // Enable WebP for better compression
        minimumCacheTTL: 604800, // Cache images for 7 days
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

export default nextConfig;
