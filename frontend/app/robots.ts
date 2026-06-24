import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/client/', '/api/', '/galerie/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
