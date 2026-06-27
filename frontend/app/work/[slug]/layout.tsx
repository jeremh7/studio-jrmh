import type { Metadata } from 'next'

const API_URL    = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:8000'
const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const res     = await fetch(`${API_URL}/api/work/${slug}`, { next: { revalidate: 3600 } })
    const project = res.ok ? await res.json() : null

    if (!project) return {}

    const title       = `${project.title} — Jérémy Hordé Photographe`
    const description = project.description
      ? project.description.slice(0, 155).replace(/\n/g, ' ')
      : `${project.title} — Reportage photo par Jérémy Hordé, photographe à Troyes spécialisé ${project.categoryLabel ?? project.category}.`

    const coverUrl = project.coverImage
      ? `${API_URL}/uploads/projects/${project.id}/${project.coverImage}`
      : `${SITE_URL}/images/hero.jpg`

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/work/${slug}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/work/${slug}`,
        type: 'article',
        images: [{ url: coverUrl, width: 1200, height: 800, alt: project.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [coverUrl],
      },
    }
  } catch {
    return {}
  }
}

export default function WorkSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
