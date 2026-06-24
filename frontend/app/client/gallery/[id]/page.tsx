'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { apiGetGalleryPhotos, apiDownloadGallery, apiGenerateShareToken, apiRevokeShareToken } from '@/lib/api'
import type { GalleryWithPhotos, Photo } from '@/lib/types'
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
function Lightbox({ photos, index, onClose, onNav, ariaClose, ariaPrev, ariaNext, navHint }: {
  photos: Photo[]
  index: number
  onClose: () => void
  onNav: (delta: number) => void
  ariaClose: string
  ariaPrev: string
  ariaNext: string
  navHint: string
}) {
  const photo = photos[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft')  onNav(-1)
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
      style={{ backgroundColor: 'rgba(8,8,8,0.94)', zIndex: 200 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Barre top — positionnée sous la navbar (60px) */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between px-5"
        style={{ top: 60, height: 52, zIndex: 10 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Compteur */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(236,232,223,0.3)' }}>
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>

        {/* Bouton ✕ */}
        <button
          onClick={onClose}
          style={{
            ...btnBase,
            width: 40, height: 40,
            color: 'rgba(236,232,223,0.7)',
            fontSize: 18, lineHeight: 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(236,232,223,0.08)'
            e.currentTarget.style.borderColor = 'rgba(236,232,223,0.3)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(8,8,8,0.6)'
            e.currentTarget.style.borderColor = 'rgba(236,232,223,0.12)'
            e.currentTarget.style.color = 'rgba(236,232,223,0.7)'
          }}
          aria-label={ariaClose}
        >
          ✕
        </button>
      </div>

      {/* Image */}
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
        {photo.caption && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textAlign: 'center', color: 'rgba(236,232,223,0.3)', marginTop: 10 }}>
            {photo.caption}
          </p>
        )}
      </motion.div>

      {/* Flèches navigation */}
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

      {/* Hint clavier — discret en bas */}
      <div
        style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {navHint}
      </div>
    </motion.div>
  )
}

// ── Page galerie ──────────────────────────────────────────────
export default function GalleryPage() {
  const { t, locale } = useLang()
  const gp = t.galleryPage
  const { data: session, status } = useSession()
  const router  = useRouter()
  const params  = useParams<{ id: string }>()
  const id      = parseInt(params.id, 10)

  const [data, setData]               = useState<GalleryWithPhotos | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [lightbox, setLightbox]       = useState<number | null>(null)
  const [downloading, setDownloading]   = useState(false)
  const [shareToken, setShareToken]     = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied]             = useState(false)
  const [revokeModal, setRevokeModal]   = useState(false)

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/galerie/${token}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    if (session.error === 'TokenExpired') { signOut({ callbackUrl: '/login' }); return }

    apiGetGalleryPhotos(id, session.accessToken)
      .then(d => { setData(d); setShareToken(d.gallery.shareToken ?? null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [status, session, id, router])

  const navLightbox = useCallback((delta: number) => {
    if (lightbox === null || !data) return
    const next = (lightbox + delta + data.photos.length) % data.photos.length
    setLightbox(next)
  }, [lightbox, data])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(236,232,223,0.2)' }}>
          {gp.loading}
        </span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-[80px] px-7 pt-10">
        <Link href="/client" className="font-mono text-[8px] tracking-[0.15em] uppercase" style={{ color: 'rgba(212,168,67,0.6)', textDecoration: 'none' }}>
          {gp.back}
        </Link>
        <p className="font-mono text-[9px] tracking-[0.12em] uppercase mt-6" style={{ color: '#c04830' }}>
          // {error ?? gp.notFound}
        </p>
      </div>
    )
  }

  const { gallery, photos } = data

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            photos={photos}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onNav={navLightbox}
            ariaClose={gp.ariaClose}
            ariaPrev={gp.ariaPrev}
            ariaNext={gp.ariaNext}
            navHint={gp.navHint}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modale révocation */}
      <AnimatePresence>
        {revokeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 24px',
            }}
            onClick={() => !shareLoading && setRevokeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0f0f0f',
                border: '0.5px solid rgba(192,72,48,0.2)',
                padding: '36px 32px',
                maxWidth: 400, width: '100%',
              }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(192,72,48,0.6)', marginBottom: 16 }}>
                {gp.revokeLabel}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.04em', lineHeight: 1, marginBottom: 16 }}>
                {gp.revokeTitle}
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.06em', lineHeight: 1.8, color: 'rgba(236,232,223,0.35)', marginBottom: 28 }}>
                {gp.revokeBody.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setRevokeModal(false)}
                  disabled={shareLoading}
                  style={{
                    flex: 1, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(236,232,223,0.4)', background: 'transparent',
                    border: '0.5px solid rgba(236,232,223,0.1)', padding: '13px 0',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(236,232,223,0.7)'; e.currentTarget.style.borderColor = 'rgba(236,232,223,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(236,232,223,0.4)'; e.currentTarget.style.borderColor = 'rgba(236,232,223,0.1)' }}
                >
                  {gp.revokeCancel}
                </button>
                <button
                  onClick={async () => {
                    if (!session || shareLoading) return
                    setShareLoading(true)
                    try {
                      await apiRevokeShareToken(gallery.id, session.accessToken)
                      setShareToken(null)
                      setCopied(false)
                      setRevokeModal(false)
                    } catch {
                      // silencieux
                    } finally {
                      setShareLoading(false)
                    }
                  }}
                  disabled={shareLoading}
                  style={{
                    flex: 1, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: shareLoading ? 'rgba(192,72,48,0.35)' : 'rgba(192,72,48,0.9)',
                    background: 'rgba(192,72,48,0.06)',
                    border: '0.5px solid rgba(192,72,48,0.25)', padding: '13px 0',
                    cursor: shareLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!shareLoading) { e.currentTarget.style.background = 'rgba(192,72,48,0.12)'; e.currentTarget.style.borderColor = 'rgba(192,72,48,0.4)' }}}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,72,48,0.06)'; e.currentTarget.style.borderColor = 'rgba(192,72,48,0.25)' }}
                >
                  {shareLoading ? '…' : gp.revokeConfirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen pt-[80px]">

        {/* Header galerie */}
        <motion.div
          className="px-7 pt-10 pb-8 max-w-5xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Retour */}
          <Link
            href="/client"
            className="font-mono text-[8px] tracking-[0.2em] uppercase mb-6 inline-flex items-center gap-2 transition-colors"
            style={{ color: 'rgba(236,232,223,0.25)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.25)'}
          >
            {gp.backLink}
          </Link>

          <div className="mt-4">
            <div className="font-mono text-[9px] tracking-[0.28em] uppercase mb-2" style={{ color: 'rgba(212,168,67,0.7)' }}>
              {gp.label}
            </div>
            <h1
              className="font-bebas leading-[0.88] tracking-[0.04em] mb-4"
              style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}
            >
              {gallery.title.toUpperCase()}
            </h1>

            {/* Méta */}
            <div className="flex flex-wrap items-center gap-5">
              {gallery.sessionDate && (
                <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'rgba(236,232,223,0.3)' }}>
                  {fmtDate(gallery.sessionDate, locale)}
                </span>
              )}
              <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'rgba(236,232,223,0.3)' }}>
                {photos.length} {photos.length > 1 ? gp.photoPlural : gp.photoSingular}
              </span>
              {(() => {
                if (!gallery.expiresAt) return (
                  <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'rgba(92,245,160,0.35)' }}>
                    {gp.accessUnlimited}
                  </span>
                )
                const daysLeft = Math.ceil((new Date(gallery.expiresAt).getTime() - Date.now()) / 86_400_000)
                if (daysLeft <= 0) return null
                if (daysLeft <= 7) return (
                  <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'rgba(220,140,40,0.85)' }}>
                    {gp.expireSoonPrefix} {daysLeft} {gp.expiryDay}{daysLeft > 1 ? 's' : ''}
                  </span>
                )
                return (
                  <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'rgba(236,232,223,0.2)' }}>
                    {gp.expiryUntilPrefix} {fmtDate(gallery.expiresAt, locale)}
                  </span>
                )
              })()}
            </div>

            {/* Bannière alerte expiration imminente */}
            {gallery.expiresAt && (() => {
              const daysLeft = Math.ceil((new Date(gallery.expiresAt).getTime() - Date.now()) / 86_400_000)
              if (daysLeft > 3) return null
              return (
                <div style={{
                  marginTop: 20,
                  padding: '12px 16px',
                  border: '0.5px solid rgba(220,100,40,0.25)',
                  background: 'rgba(220,100,40,0.04)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8.5,
                  letterSpacing: '0.08em',
                  lineHeight: 1.8,
                  color: 'rgba(220,120,40,0.8)',
                }}>
                  {daysLeft <= 0
                    ? gp.bannerToday
                    : `${gp.bannerDaysPrefix} ${daysLeft} ${gp.expiryDay}${daysLeft > 1 ? 's' : ''}.`}
                  {' '}{gp.bannerTip}
                </div>
              )
            })()}

            {gallery.description && (
              <p className="font-mono text-[10px] tracking-[0.06em] mt-4 leading-relaxed" style={{ color: 'rgba(236,232,223,0.35)', maxWidth: 600 }}>
                {gallery.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Actions : téléchargement + partage côte à côte ── */}
        <motion.div
          className="px-7 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ borderTop: '0.5px solid rgba(236,232,223,0.06)', paddingTop: 28 }}
        >
          <div className="actions-row" style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* ── Col gauche : téléchargement ── */}
            {gallery.downloadEnabled && (
              <div style={{ flex: '1 1 260px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', marginBottom: 16 }}>
                  {gp.downloadLabel}
                </p>
                <button
                  onClick={async () => {
                    if (downloading || !session) return
                    setDownloading(true)
                    try {
                      await apiDownloadGallery(gallery.id, session.accessToken, gallery.title)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : gp.downloadError)
                    } finally {
                      setDownloading(false)
                    }
                  }}
                  disabled={downloading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: downloading ? 'rgba(212,168,67,0.35)' : 'rgba(212,168,67,0.8)',
                    background: 'rgba(212,168,67,0.04)',
                    border: '0.5px solid rgba(212,168,67,0.2)',
                    padding: '12px 20px', cursor: downloading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!downloading) { e.currentTarget.style.background = 'rgba(212,168,67,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,168,67,0.4)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)' }}
                >
                  {downloading ? (
                    <>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: '1px solid rgba(212,168,67,0.4)', borderTopColor: 'rgba(212,168,67,0.8)', animation: 'spin 0.8s linear infinite' }} />
                      {gp.downloadPreparing}
                    </>
                  ) : (
                    <>
                      {gp.downloadBtn}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(212,168,67,0.45)', letterSpacing: '0.1em' }}>
                        ({photos.length} photos)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Col droite : partage ── */}
            <div style={{ flex: '1 1 260px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', marginBottom: 16 }}>
              {gp.shareLabel}
            </p>

            {!shareToken ? (
              /* ── Pas de lien actif ── */
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.06em', color: 'rgba(236,232,223,0.22)', marginBottom: 20, lineHeight: 1.8 }}>
                  {gp.shareDesc.split('\n').map((l, i) => <span key={i}>{l}{i < 2 && <br />}</span>)}
                </p>
                <button
                  onClick={async () => {
                    if (!session || shareLoading) return
                    setShareLoading(true)
                    try {
                      const res = await apiGenerateShareToken(gallery.id, session.accessToken)
                      setShareToken(res.shareToken)
                    } catch {
                      // silencieux
                    } finally {
                      setShareLoading(false)
                    }
                  }}
                  disabled={shareLoading}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(212,168,67,0.8)', background: 'rgba(212,168,67,0.05)',
                    border: '0.5px solid rgba(212,168,67,0.2)', padding: '12px 20px',
                    cursor: shareLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,168,67,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.05)'; e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)' }}
                >
                  {shareLoading ? gp.shareGenerating : gp.shareGenerate}
                </button>
              </div>
            ) : (
              /* ── Lien actif ── */
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', color: 'rgba(92,245,160,0.5)', marginBottom: 16 }}>
                  {gp.shareLinkActive}
                </p>

                {/* URL tronquée + bouton copier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.06em',
                    color: 'rgba(236,232,223,0.35)', background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(236,232,223,0.08)', padding: '10px 14px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320,
                  }}>
                    /galerie/{shareToken}
                  </div>
                  <button
                    onClick={() => copyLink(shareToken)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: copied ? 'rgba(92,245,160,0.85)' : 'rgba(212,168,67,0.8)',
                      border: `0.5px solid ${copied ? 'rgba(92,245,160,0.3)' : 'rgba(212,168,67,0.25)'}`,
                      background: copied ? 'rgba(92,245,160,0.06)' : 'rgba(212,168,67,0.06)',
                      padding: '10px 16px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    {copied ? gp.shareCopied : gp.shareCopy}
                  </button>
                </div>

                {/* Révoquer */}
                <button
                  onClick={() => setRevokeModal(true)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(192,72,48,0.5)', background: 'transparent',
                    border: '0.5px solid rgba(192,72,48,0.15)', padding: '8px 14px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(192,72,48,0.8)'; e.currentTarget.style.borderColor = 'rgba(192,72,48,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(192,72,48,0.5)'; e.currentTarget.style.borderColor = 'rgba(192,72,48,0.15)' }}
                >
                  {gp.shareRevoke}
                </button>
              </div>
            )}
            </div>

          </div>
        </motion.div>

        {/* Séparateur */}
        <div className="px-7 mb-6">
          <div style={{ height: 1, backgroundColor: 'rgba(236,232,223,0.06)' }} />
        </div>

        {/* Grille photos */}
        {photos.length === 0 ? (
          <div className="px-7 py-16 text-center">
            <p className="font-mono text-[9px] tracking-[0.15em] uppercase" style={{ color: 'rgba(236,232,223,0.18)' }}>
              {gp.emptyMsg}
            </p>
          </div>
        ) : (
          <div
            className="px-7 pb-16"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(155px, 20vw, 280px), 1fr))',
              gap: '2px',
            }}
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                className="relative overflow-hidden cursor-pointer group"
                style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '4/3', backgroundColor: 'rgba(20,20,20,0.8)' }}
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
                  className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.7) 0%, transparent 60%)' }}
                >
                  {photo.caption && (
                    <p className="font-mono text-[8px] tracking-[0.08em]" style={{ color: 'rgba(236,232,223,0.7)' }}>
                      {photo.caption}
                    </p>
                  )}
                </div>
                <div
                  className="absolute top-2 left-2 font-mono text-[7px] tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(236,232,223,0.4)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
