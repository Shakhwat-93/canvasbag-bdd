/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  serverExternalPackages: ['better-sqlite3', 'sharp'],
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85, 90, 95],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'gnrswtpazngfbjdkeckz.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'drbpysumezfjbudxzxzj.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io',
      },
      {
        protocol: 'https',
        hostname: 'supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io',
      },
      {
        protocol: 'https',
        hostname: 'pub-c87cf7c070ae4a08a702a89ea3340662.r2.dev',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/brand/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/favicon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
