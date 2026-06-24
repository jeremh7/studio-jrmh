import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export const metadata: Metadata = {
  title: 'À Propos — Jérémy Hordé, Photographe à Troyes',
  description:
    'Découvrez Jérémy Hordé, photographe professionnel basé à Troyes (Aube). Sport, portrait et événement — une vision artistique toujours au bon endroit.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'À Propos — Jérémy Hordé, Photographe à Troyes',
    description:
      'Photographe professionnel basé à Troyes. Sport, portrait, événement — toujours présent au bon endroit.',
    url: `${SITE_URL}/about`,
    images: [
      {
        url: '/images/profil.jpg',
        width: 1200,
        height: 630,
        alt: 'Jérémy Hordé — Photographe Sport & Portrait Troyes',
      },
    ],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
