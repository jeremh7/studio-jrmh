const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  {
    // 'unsafe-inline' requis : le site utilise des styles React inline et des
    // blocs <style> pour les hover/media/keyframes, sans nonces — durcir plus
    // demanderait un refactor complet du CSS du site.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${API_URL}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // La CSP bloque eval(), utilisé par le Fast Refresh de `next dev` — on ne
    // durcit qu'en production pour ne pas casser le hot-reload en local.
    if (process.env.NODE_ENV !== 'production') return []
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  async rewrites() {
    return [
      { source: '/admin', destination: `${API_URL}/admin` },
      { source: '/admin/:path*', destination: `${API_URL}/admin/:path*` },
    ]
  },
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
