import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export const metadata: Metadata = {
  title: 'Portfolio — Photographie Sport & Portrait',
  description:
    'Explorez le portfolio de Jérémy Hordé : reportages sportifs, séances portrait et photographie événementielle à Troyes et alentours. Chaque image raconte une histoire.',
  alternates: {
    canonical: `${SITE_URL}/work`,
  },
  openGraph: {
    title: 'Portfolio — Photographie Sport & Portrait | Studiø JRMH',
    description:
      'Reportages sportifs, portraits et événementiel — le portfolio de Jérémy Hordé, photographe à Troyes.',
    url: `${SITE_URL}/work`,
    images: [
      {
        url: '/images/accueil-01.jpg',
        width: 1200,
        height: 630,
        alt: 'Portfolio photographe sport et portrait — Jérémy Hordé Troyes',
      },
    ],
  },
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
