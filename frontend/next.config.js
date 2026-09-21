/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 jours — noms de fichiers uniques, cache long sans risque
    remotePatterns: [
      { protocol: 'https', hostname: 'backend-production-ac8c.up.railway.app' },
      { protocol: 'https', hostname: 'pub-441fba9f73434bd8bcfcc313c19c89c9.r2.dev' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
    ],
  },
}

module.exports = nextConfig
