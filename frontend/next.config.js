/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 jours — noms de fichiers uniques, cache long sans risque
    remotePatterns: [
      { protocol: 'https', hostname: 'studio-jrmh-api.up.railway.app' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
    ],
  },
}

module.exports = nextConfig
