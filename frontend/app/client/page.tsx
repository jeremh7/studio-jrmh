'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'motion/react'
import { apiGetGalleries } from '@/lib/api'
import type { Gallery } from '@/lib/types'
import { useLang } from '@/lib/LangContext'

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtDateShort(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysFromNow(iso: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function GalleryCard({ gallery, index }: { gallery: Gallery; index: number }) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const { t, locale } = useLang()
  const cp = t.clientPage

  const isExpired    = gallery.isExpired
  const isAccessible = gallery.isAccessible
  const daysLeft     = daysFromNow(gallery.expiresAt)
  const expiringSoon = isAccessible && daysLeft !== null && daysLeft <= 7

  const statusLabel  = isExpired ? cp.statusExpired : isAccessible ? cp.statusAvailable : cp.statusPending
  const statusColor  = isExpired
    ? 'rgba(192,72,48,0.85)'
    : expiringSoon
      ? 'rgba(220,140,40,0.9)'
      : isAccessible
        ? 'rgba(92,245,160,0.85)'
        : 'rgba(212,168,67,0.85)'
  const statusBorder = isExpired
    ? 'rgba(192,72,48,0.25)'
    : expiringSoon
      ? 'rgba(220,140,40,0.25)'
      : isAccessible
        ? 'rgba(92,245,160,0.2)'
        : 'rgba(212,168,67,0.25)'

  const s = daysLeft !== null && daysLeft !== 1 ? 's' : ''
  const expiryLine = (() => {
    if (isExpired && gallery.expiresAt) {
      const daysAgo = Math.abs(daysLeft ?? 0)
      const ds = daysAgo !== 1 ? 's' : ''
      const ago = locale === 'fr'
        ? `${cp.expiryAgoPrefix} ${daysAgo} ${cp.expiryDay}${ds}`
        : `${cp.expiryAgoPrefix} ${daysAgo} ${cp.expiryDay}${ds} ago`
      return { text: ago, color: 'rgba(192,72,48,0.55)' }
    }
    if (expiringSoon && daysLeft !== null) {
      if (daysLeft === 0) return { text: cp.expiryToday, color: 'rgba(220,100,40,0.85)' }
      return { text: `${cp.expiryInPrefix} ${daysLeft} ${cp.expiryDay}${s}`, color: 'rgba(220,140,40,0.75)' }
    }
    if (isAccessible && !gallery.expiresAt) {
      return { text: cp.expiryUnlimited, color: 'rgba(92,245,160,0.4)' }
    }
    if (isAccessible && gallery.expiresAt) {
      return { text: `${cp.expiryUntil} ${fmtDateShort(gallery.expiresAt, locale)}`, color: 'rgba(236,232,223,0.25)' }
    }
    return null
  })()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={isAccessible ? `/client/gallery/${gallery.id}` : '#'}
        style={{ textDecoration: 'none', pointerEvents: isAccessible ? 'auto' : 'none' }}
      >
        <div
          className="group relative overflow-hidden"
          style={{
            border: `0.5px solid ${isExpired ? 'rgba(192,72,48,0.1)' : 'rgba(236,232,223,0.08)'}`,
            background: isExpired ? 'rgba(192,72,48,0.02)' : 'rgba(255,255,255,0.02)',
            transition: 'border-color 0.2s, background 0.2s',
            opacity: isExpired ? 0.65 : 1,
          }}
          onMouseEnter={e => {
            if (isAccessible) {
              e.currentTarget.style.borderColor = expiringSoon ? 'rgba(220,140,40,0.3)' : 'rgba(212,168,67,0.25)'
              e.currentTarget.style.background  = expiringSoon ? 'rgba(220,140,40,0.03)' : 'rgba(212,168,67,0.03)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isExpired ? 'rgba(192,72,48,0.1)' : 'rgba(236,232,223,0.08)'
            e.currentTarget.style.background  = isExpired ? 'rgba(192,72,48,0.02)' : 'rgba(255,255,255,0.02)'
          }}
        >
          {/* Barre colorée top */}
          <div style={{
            height: '1.5px',
            background: isExpired
              ? 'rgba(192,72,48,0.2)'
              : expiringSoon
                ? 'linear-gradient(90deg, rgba(220,140,40,0.6), transparent)'
                : isAccessible
                  ? 'linear-gradient(90deg, rgba(212,168,67,0.6), transparent)'
                  : 'rgba(236,232,223,0.05)',
          }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Header titre + badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 3vw, 28px)',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  color: isAccessible ? 'rgba(236,232,223,0.9)' : 'rgba(236,232,223,0.3)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {gallery.title}
                </p>
                {gallery.sessionDate && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(236,232,223,0.2)', marginTop: 6 }}>
                    {fmtDate(gallery.sessionDate, locale)}
                  </p>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: statusColor,
                border: `0.5px solid ${statusBorder}`,
                padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {statusLabel}
              </span>
            </div>

            {/* Ligne expiration / accès */}
            {expiryLine && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.1em', color: expiryLine.color, marginBottom: 16 }}>
                {expiryLine.text}
              </p>
            )}

            {/* Séparateur */}
            <div style={{ height: '0.5px', background: 'rgba(236,232,223,0.06)', marginBottom: 20 }} />

            {/* Compteur photos */}
            <div style={{ marginBottom: isAccessible || isExpired ? 20 : 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)', display: 'block', marginBottom: 4 }}>
                {cp.photoLabel}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.04em', color: isAccessible ? 'rgba(236,232,223,0.75)' : 'rgba(236,232,223,0.2)' }}>
                {gallery.photoCount}
              </span>
            </div>

            {/* Message contextuel pour les états non-accessibles */}
            {!isAccessible && !isExpired && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', lineHeight: 1.7, color: 'rgba(236,232,223,0.2)', marginTop: 4 }}>
                {cp.pendingMsg.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
              </p>
            )}
            {isExpired && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', lineHeight: 1.7, color: 'rgba(192,72,48,0.45)', marginTop: 4 }}>
                {cp.expiredMsg.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
              </p>
            )}

            {/* CTA */}
            {isAccessible && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: expiringSoon ? 'rgba(220,140,40,0.7)' : 'rgba(212,168,67,0.6)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.15s',
              }}>
                {cp.openGallery}
                <span style={{ display: 'inline-block', transition: 'transform 0.2s' }} className="group-hover:translate-x-1">→</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ClientDashboard() {
  const { t, locale } = useLang()
  const cp = t.clientPage
  const { data: session, status } = useSession()
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    // JWT Symfony expiré (détecté dans auth.ts callback)
    if (session.error === 'TokenExpired') { signOut({ callbackUrl: '/login' }); return }
    apiGetGalleries(session.accessToken)
      .then(data => setGalleries(data.galleries))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [status, session, router])

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 1, height: 48, background: 'rgba(212,168,67,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)' }}>
            {t.clientPage.loading}
          </span>
        </motion.div>
      </div>
    )
  }

  if (!session) return null

  const client           = session.client
  const activeGalleries  = galleries.filter(g => g.isAccessible)
  const pendingGalleries = galleries.filter(g => !g.isAccessible && !g.isExpired)
  const expiredGalleries = galleries.filter(g => g.isExpired)

  return (
    <div style={{ background: '#080808', minHeight: '100svh', position: 'relative', overflow: 'hidden' }}>

      {/* Ghost text décoratif */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, right: -40, zIndex: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(140px, 22vw, 240px)',
        lineHeight: 0.85,
        color: 'transparent',
        WebkitTextStroke: '1px rgba(240,240,240,0.022)',
        userSelect: 'none', pointerEvents: 'none',
        textAlign: 'right',
      }}>
        {locale === 'fr' ? 'MON' : 'MY'}<br />{locale === 'fr' ? 'ESPACE' : 'SPACE'}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: 'clamp(100px,12vh,130px) clamp(20px,5vw,48px) 80px' }}>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <motion.div
          style={{ marginBottom: 56 }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span style={{ display: 'block', width: 20, height: '0.5px', background: 'rgba(212,168,67,0.7)' }} />
            {cp.label}
          </motion.div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <h1 style={{ margin: 0, lineHeight: 0.88 }}>
              <div style={{ overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 9vw, 80px)', letterSpacing: '0.04em', color: '#fff' }}
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {cp.greeting}
                </motion.span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 9vw, 80px)', letterSpacing: '0.04em', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.38)' }}
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                >
                  {client.firstName.toUpperCase()}
                </motion.span>
              </div>
            </h1>

            <motion.button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)', background: 'none', border: '0.5px solid rgba(236,232,223,0.08)', cursor: 'pointer', padding: '9px 16px', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(236,232,223,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,232,223,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(236,232,223,0.2)'; e.currentTarget.style.borderColor = 'rgba(236,232,223,0.08)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {cp.signOut}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Bandeau email non vérifié ──────────────────────────── */}
        <AnimatePresence>
          {!client.isVerified && (
            <motion.div
              style={{ marginBottom: 32, padding: '14px 20px', border: '0.5px solid rgba(212,168,67,0.25)', background: 'rgba(212,168,67,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.7)', margin: 0 }}>
                {cp.verifyEmail}
              </p>
              <Link href="/client/verify-email" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.9)', textDecoration: 'none' }}>
                {cp.resend}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats compte ───────────────────────────────────────── */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 56, background: 'rgba(236,232,223,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[
            { label: cp.statsEmail,     value: client.email,                        mono: true },
            { label: cp.statsGalleries, value: String(galleries.length),            mono: false },
            { label: cp.statsMember,    value: fmtDateShort(client.createdAt, locale), mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ background: '#080808', padding: '20px 20px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.2)', display: 'block', marginBottom: 8 }}>
                {label}
              </span>
              <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)', fontSize: mono ? 10 : 22, letterSpacing: mono ? '0.04em' : '0.04em', color: 'rgba(236,232,223,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Galeries ───────────────────────────────────────────── */}
        <div>
          {/* Titre section */}
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.7)' }}>
              {cp.galleriesLabel}
            </span>
            {galleries.length > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'rgba(236,232,223,0.15)' }}>
                {galleries.length} {galleries.length > 1 ? cp.galleryPlural : cp.gallerySingular}
              </span>
            )}
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(236,232,223,0.06)' }} />
          </motion.div>

          {/* Erreur */}
          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c04830', marginBottom: 24 }}>
              // {error}
            </p>
          )}

          {/* Vide */}
          {!error && galleries.length === 0 && (
            <motion.div
              style={{ border: '0.5px solid rgba(236,232,223,0.06)', minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 7vw, 64px)', letterSpacing: '0.06em', color: 'transparent', WebkitTextStroke: '1px rgba(236,232,223,0.07)' }}>
                {cp.emptyGhost}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', textAlign: 'center' }}>
                {cp.emptyMsg.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
              </p>
            </motion.div>
          )}

          {/* Galeries actives */}
          {activeGalleries.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(92,245,160,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(92,245,160,0.6)' }} />
                {cp.activeLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                {activeGalleries.map((g, i) => <GalleryCard key={g.id} gallery={g} index={i} />)}
              </div>
            </div>
          )}

          {/* Galeries en attente */}
          {pendingGalleries.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,168,67,0.5)' }} />
                {cp.pendingLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                {pendingGalleries.map((g, i) => <GalleryCard key={g.id} gallery={g} index={activeGalleries.length + i} />)}
              </div>
            </div>
          )}

          {/* Galeries expirées */}
          {expiredGalleries.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(192,72,48,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(192,72,48,0.4)' }} />
                {cp.expiredLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                {expiredGalleries.map((g, i) => <GalleryCard key={g.id} gallery={g} index={activeGalleries.length + pendingGalleries.length + i} />)}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 80, paddingTop: 24, borderTop: '0.5px solid rgba(236,232,223,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.1)' }}>
            © {new Date().getFullYear()} Studiø.JRMH
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.1)' }}>
            {cp.footerSecure}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
