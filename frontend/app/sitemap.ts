import type { MetadataRoute } from 'next'

const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:8000'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/work`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/contact`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const res      = await fetch(`${API_URL}/api/work`, { next: { revalidate: 3600 } })
    const projects = res.ok ? await res.json() : []

    const projectRoutes: MetadataRoute.Sitemap = projects.map((p: { slug: string; updatedAt?: string }) => ({
      url:             `${SITE_URL}/work/${p.slug}`,
      lastModified:    p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority:        0.8,
    }))

    return [...staticRoutes, ...projectRoutes]
  } catch {
    return staticRoutes
  }
}
