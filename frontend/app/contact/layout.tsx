import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export const metadata: Metadata = {
  title: 'Contact — Réserver une Séance Photo à Troyes',
  description:
    'Contactez Jérémy Hordé pour réserver votre séance photo à Troyes. Portrait, sport, événement — réponse sous 48h. Tarifs sur demande.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact — Réserver une Séance Photo | Studiø JRMH',
    description:
      'Réservez votre séance photo avec Jérémy Hordé, photographe à Troyes. Portrait, sport, événement — réponse sous 48h.',
    url: `${SITE_URL}/contact`,
    images: [
      {
        url: '/images/contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Studiø JRMH — Photographe Troyes',
      },
    ],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
