import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/lib/LangContext'
import { SessionProvider } from 'next-auth/react'
import LayoutClient from '@/components/LayoutClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studiojrmh.fr'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Studiø JRMH — Photographe Sport & Portrait | Troyes',
    template: '%s | Studiø JRMH',
  },
  description:
    'Jérémy Hordé, photographe professionnel spécialisé sport et portrait, basé à Troyes (Aube). Séances photo, reportages sportifs, portraits corporate et événementiel.',
  keywords: [
    'photographe Troyes',
    'photographe sport Troyes',
    'photographe portrait Troyes',
    'séance photo Troyes',
    'photographe professionnel Aube',
    'photographe événement Troyes',
    'photographe Grand Est',
    'Jérémy Hordé photographe',
    'studio photo Troyes',
  ],
  authors: [{ name: 'Jérémy Hordé', url: SITE_URL }],
  creator: 'Jérémy Hordé',
  publisher: 'Studiø JRMH',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'Studiø JRMH',
    title: 'Studiø JRMH — Photographe Sport & Portrait | Troyes',
    description:
      'Jérémy Hordé, photographe professionnel spécialisé sport et portrait, basé à Troyes. Reportages sportifs, portraits, événementiel.',
    images: [
      {
        url: '/images/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Studiø JRMH — Jérémy Hordé Photographe Sport & Portrait Troyes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studiø JRMH — Photographe Sport & Portrait | Troyes',
    description:
      'Jérémy Hordé, photographe professionnel spécialisé sport et portrait, basé à Troyes.',
    images: ['/images/hero.jpg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'Y6mYWnM5Y-5u2YUm4XLUiz2cTFWnToLm0w7euHY1nQ',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['LocalBusiness', 'ProfessionalService'],
      '@id': `${SITE_URL}/#business`,
      name: 'Studiø JRMH',
      alternateName: 'Jérémy Hordé Photographe',
      description:
        'Photographe professionnel spécialisé sport et portrait, basé à Troyes (Aube). Séances photo individuelles, portraits corporate, reportages sportifs et événementiel.',
      url: SITE_URL,
      image: `${SITE_URL}/images/profil.jpg`,
      email: 'studio.jrmh@gmail.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Troyes',
        addressRegion: 'Aube',
        postalCode: '10000',
        addressCountry: 'FR',
      },
      areaServed: [
        { '@type': 'City', name: 'Troyes' },
        { '@type': 'AdministrativeArea', name: 'Aube' },
        { '@type': 'AdministrativeArea', name: 'Grand Est' },
        { '@type': 'Country', name: 'France' },
      ],
      priceRange: '€€',
      knowsAbout: [
        'Photographie sportive',
        'Photographie portrait',
        'Photographie événementielle',
        'Photographie corporate',
      ],
      potentialAction: {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/contact`,
        },
        name: 'Réserver une séance photo',
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Jérémy Hordé',
      jobTitle: 'Photographe professionnel',
      url: `${SITE_URL}/about`,
      image: `${SITE_URL}/images/profil.jpg`,
      worksFor: { '@id': `${SITE_URL}/#business` },
      knowsAbout: ['Photographie sportive', 'Portrait', 'Événementiel'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Troyes',
        addressCountry: 'FR',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Studiø JRMH',
      description: 'Portfolio et espace client — Jérémy Hordé Photographe',
      publisher: { '@id': `${SITE_URL}/#business` },
      inLanguage: ['fr-FR', 'en-US'],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#080808" />
        <meta name="geo.placename" content="Troyes, France" />
        <meta name="geo.region" content="FR-10" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SessionProvider>
          <LangProvider>
            <LayoutClient>{children}</LayoutClient>
          </LangProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
