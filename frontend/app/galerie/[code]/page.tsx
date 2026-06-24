'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { apiPublicShareView } from '@/lib/api'
import type { Photo, PublicGallery } from '@/lib/types'
import { useLang } from '@/lib/LangContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function photoSrc(url: string): string {
  if (url.startsWith('http')) return url
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onNav, navHint, ariaClose, ariaPrev, ariaNext }: {
  photos: Photo[]
  index: number
  onClose: () => void
  onNav: (delta: number) => void
  navHint: string
  ariaClose: string
  ariaPrev: string
  ariaNext: string
}) {
  const photo = photos[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  onNav(1)
      if (e.key === 'ArrowLeft')   onNav(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNav])

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(8,8,8,0.6)', border: '0.5px solid rgba(236,232,223,0.12)',
    backdropFilter: 'blur(8px)', cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(8,8,8,0.96)', zIndex: 200 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        className="absolute left-0 right-0 flex items-center justify-between px-5"
        style={{ top: 0, height: 60, zIndex: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(236,232,223,0.3)' }}>
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>
        <button
          onClick={onClose}
          style={{ ...btnBase, width: 40, height: 40, color: 'rgba(236,232,223,0.7)', fontSize: 18 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,232,223,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(236,232,223,0.7)' }}
          aria-label={ariaClose}
        >✕</button>
      </div>

      <motion.div
        key={index}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photoSrc(photo.url)}
          alt={photo.caption ?? photo.filename}
          style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
        />
      </motion.div>

      {photos.length > 1 && (
        <>
          <button
            style={{ ...btnBase, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, color: 'rgba(236,232,223,0.6)', fontSize: 20 }}
            onClick={e => { e.stopPropagation(); onNav(-1) }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,232,223,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(236,232,223,0.6)' }}
            aria-label={ariaPrev}
          >←</button>
          <button
            style={{ ...btnBase, position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, color: 'rgba(236,232,223,0.6)', fontSize: 20 }}
            onClick={e => { e.stopPropagation(); onNav(1) }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,232,223,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(236,232,223,0.6)' }}
            aria-label={ariaNext}
          >→</button>
        </>
      )}

      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.1)' }}>
        {navHint}
      </div>
    </motion.div>
  )
}

// ── Page publique galerie ─────────────────────────────────────
export default function PublicGalleryPage() {
  const { t, locale } = useLang()
  const sgp = t.sharedGalleryPage
  const params = useParams<{ code: string }>()
  const code   = params.code ?? ''

  const [gallery, setGallery] = useState<PublicGallery | null>(null)
  const [photos, setPhotos]   = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!code) return
    apiPublicShareView(code)
      .then(data => {
        setGallery(data.gallery as unknown as PublicGallery)
        setPhotos(data.photos)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [code])

  const navLightbox = useCallback((delta: number) => {
    if (lightbox === null) return
    setLightbox(prev => prev === null ? null : (prev + delta + photos.length) % photos.length)
  }, [lightbox, photos.length])

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)' }}>
          {sgp.loading}
        </span>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div style={{ minHeight: '100svh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 10vw, 80px)', letterSpacing: '0.04em', color: 'rgba(236,232,223,0.08)', marginBottom: 24 }}>
            OUPS
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(192,72,48,0.7)', marginBottom: 24 }}>
            {error ?? sgp.invalidLink}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', color: 'rgba(236,232,223,0.2)', marginBottom: 20, lineHeight: 1.7 }}>
            {sgp.invalidBody.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
          </p>
          <Link
            href="/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.5)', textDecoration: 'none' }}
          >
            {sgp.hasAccount}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            photos={photos}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onNav={navLightbox}
            navHint={sgp.navHint}
            ariaClose={sgp.ariaClose}
            ariaPrev={sgp.ariaPrev}
            ariaNext={sgp.ariaNext}
          />
        )}
      </AnimatePresence>

      <div style={{ minHeight: '100svh', background: '#080808' }}>

        {/* Header */}
        <motion.div
          style={{ padding: 'clamp(48px, 8vh, 80px) clamp(20px, 5vw, 56px) 36px', maxWidth: 960, margin: '0 auto' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Breadcrumb */}
          <Link
            href="/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.2)'}
          >
            {sgp.back}
          </Link>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.55)', marginBottom: 14 }}>
            {sgp.label}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 64px)', letterSpacing: '0.04em', lineHeight: 0.9, marginBottom: 20 }}>
            {gallery.title.toUpperCase()}
          </h1>

          {/* Méta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', marginBottom: 12 }}>
            {(gallery as any).sessionDate && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'rgba(236,232,223,0.25)' }}>
                {fmtDate((gallery as any).sessionDate, locale)}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'rgba(236,232,223,0.25)' }}>
              {photos.length} {photos.length > 1 ? sgp.photoPlural : sgp.photoSingular}
            </span>
          </div>

          {gallery.description && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', lineHeight: 1.7, color: 'rgba(236,232,223,0.3)', maxWidth: 560, marginTop: 8 }}>
              {gallery.description}
            </p>
          )}
        </motion.div>

        {/* Séparateur */}
        <div style={{ margin: '0 clamp(20px, 5vw, 56px) 32px', height: 1, background: 'rgba(236,232,223,0.05)' }} />

        {/* Grille photos */}
        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.15)' }}>
              {sgp.emptyMsg}
            </p>
          </div>
        ) : (
          <div style={{
            padding: '0 clamp(20px, 5vw, 56px) 80px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(155px, 20vw, 280px), 1fr))',
            gap: '2px',
          }}>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                className="relative overflow-hidden cursor-pointer group"
                style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '4/3', background: 'rgba(20,20,20,0.8)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4 }}
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photoSrc(photo.url)}
                  alt={photo.caption ?? photo.filename}
                  loading={i < 6 ? 'eager' : 'lazy'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.5) 0%, transparent 50%)' }}
                />
                <div style={{ position: 'absolute', top: 8, left: 8, fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', color: 'rgba(236,232,223,0.35)', opacity: 0, transition: 'opacity 0.2s' }}
                  className="group-hover:opacity-100">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer branding */}
        <div style={{ borderTop: '0.5px solid rgba(236,232,223,0.05)', padding: '24px clamp(20px, 5vw, 56px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.12em', color: 'rgba(236,232,223,0.15)' }}>
            STUDIØ JRMH
          </span>
          <Link
            href="/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.15)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.5)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.15)'}
          >
            {sgp.hasAccount}
          </Link>
        </div>
      </div>
    </>
  )
}
