/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DexScreener embed iframe'e izin ver
          {
            key: 'Content-Security-Policy',
            value: "frame-src https://dexscreener.com https://*.dexscreener.com;",
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig
