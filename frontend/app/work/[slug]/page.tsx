'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'motion/react'
import { getProject, type Project, type ProjectPhoto } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function absUrl(src: string): string {
  if (!src) return ''
  if (src.startsWith('http')) return src
  return `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onNav, strings }: {
  photos: ProjectPhoto[]
  index: number
  onClose: () => void
  onNav: (delta: number) => void
  strings: { ariaClose: string; ariaPrev: string; ariaNext: string; navHint: string }
}) {
  const photo = photos[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft')  onNav(-1)
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose, onNav])

  if (!photo) return null

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(8,8,8,0.6)', border: '0.5px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)', cursor: 'pointer',
    transition: 'background 0.15s',
  }

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(8,8,8,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)' }}>
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>
        <button
          onClick={onClose}
          style={{ ...btnBase, width: 40, height: 40, color: 'rgba(255,255,255,0.6)', fontSize: 18 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          aria-label={strings.ariaClose}
        >✕</button>
      </div>

      <motion.div
        key={index}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={absUrl(photo.url)}
          width={photo.width ?? 1400}
          height={photo.height ?? 940}
          style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
          alt={photo.caption ?? `Photo ${index + 1}`}
          priority
        />
        {photo.caption && (
          <div style={{ position: 'absolute', bottom: -28, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
            {photo.caption}
          </div>
        )}
      </motion.div>

      {photos.length > 1 && (
        <>
          <button
            style={{ ...btnBase, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, color: 'rgba(255,255,255,0.5)', fontSize: 20 }}
            onClick={e => { e.stopPropagation(); onNav(-1) }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            aria-label={strings.ariaPrev}
          >←</button>
          <button
            style={{ ...btnBase, position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, color: 'rgba(255,255,255,0.5)', fontSize: 20 }}
            onClick={e => { e.stopPropagation(); onNav(1) }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,8,8,0.6)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            aria-label={strings.ariaNext}
          >→</button>
        </>
      )}

      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
        {strings.navHint}
      </div>
    </motion.div>
  )
}

// ── Photo avec animation scroll ───────────────────────────────
function Photo({ photo, index, onClick }: { photo: ProjectPhoto; index: number; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="photo-thumb"
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', background: '#0d0d0d', breakInside: 'avoid', marginBottom: '4px', display: 'block' }}
    >
      <div style={{ position: 'relative', aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '3/2' }}>
        <Image
          src={absUrl(photo.url)}
          fill
          sizes="(max-width:700px) 100vw, (max-width:1200px) 50vw, 33vw"
          style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
          alt={photo.caption ?? `Photo ${index + 1}`}
          className="thumb-img"
        />
        <div className="thumb-overlay" style={{ position: 'absolute', inset: 0, opacity: 0, background: 'rgba(8,8,8,0.3)', transition: 'opacity 0.2s' }} />
        <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', color: 'rgba(255,255,255,0)', transition: 'color 0.2s' }} className="thumb-num">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>
      {photo.caption && (
        <div style={{ padding: '5px 2px', fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.18)' }}>
          {photo.caption}
        </div>
      )}
    </motion.div>
  )
}

// ── Hero avec parallax ────────────────────────────────────────
function Hero({ project, backLabel, scrollLabel, photoSingular, photoPlural }: {
  project: Project
  backLabel: string
  scrollLabel: string
  photoSingular: string
  photoPlural: string
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY    = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const textOp  = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <div ref={heroRef} style={{ position: 'relative', height: '100svh', overflow: 'hidden' }}>
      {project.coverImage ? (
        <motion.div style={{ position: 'absolute', inset: '-12% 0', y: imgY }}>
          <Image
            src={absUrl(project.coverImage)}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
            alt={project.title}
          />
        </motion.div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #141210, #080808)' }} />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.65) 35%, rgba(8,8,8,0.12) 65%, rgba(8,8,8,0.45) 100%)' }} />

      <motion.div
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(32px,5vw,64px)', opacity: textOp }}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}
        >
          <Link href="/work" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
          >
            {backLabel}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.65)' }}>
            {project.categoryLabel}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 9vw, 110px)', letterSpacing: '0.03em', lineHeight: 0.86, margin: 0, color: '#fff' }}
        >
          {project.title.toUpperCase()}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ display: 'flex', gap: 24, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}
        >
          {project.location && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)' }}>
              ◎ {project.location}
            </span>
          )}
          {project.eventDate && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)' }}>
              {project.eventDate}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>
            {(project.photos ?? []).length} {(project.photos ?? []).length !== 1 ? photoPlural : photoSingular}
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        style={{ position: 'absolute', right: 'clamp(16px,3vw,32px)', bottom: 'clamp(24px,4vh,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', writingMode: 'vertical-rl' }}>
          {scrollLabel}
        </span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }}
        />
      </motion.div>
    </div>
  )
}

// ── Page projet ───────────────────────────────────────────────
export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = useLang()
  const pp = t.projectPage
  const { slug } = use(params)
  const [project, setProject]        = useState<Project | null>(null)
  const [loading, setLoading]        = useState(true)
  const [lightboxIndex, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    getProject(slug).then(data => { setProject(data); setLoading(false) })
  }, [slug])

  const photos = project?.photos ?? []

  const navLightbox = useCallback((delta: number) => {
    setLightbox(prev => prev === null ? null : (prev + delta + photos.length) % photos.length)
  }, [photos.length])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>
          {pp.loading}
        </span>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,12vw,100px)', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.08)' }}>
          404
        </span>
        <Link href="/work" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          {pp.notFound}
        </Link>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightbox(null)}
            onNav={navLightbox}
            strings={{ ariaClose: pp.ariaClose, ariaPrev: pp.ariaPrev, ariaNext: pp.ariaNext, navHint: pp.navHint }}
          />
        )}
      </AnimatePresence>

      <div style={{ background: '#080808', minHeight: '100vh' }}>

        {/* Hero plein écran */}
        <Hero
          project={project}
          backLabel={pp.backToPortfolio}
          scrollLabel={pp.scroll}
          photoSingular={pp.photoSingular}
          photoPlural={pp.photoPlural}
        />

        {/* Description */}
        {project.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7 }}
            style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,5vw,64px) 0', maxWidth: 680 }}
          >
            <div style={{ width: 28, height: '0.5px', background: 'rgba(212,168,67,0.5)', marginBottom: 24 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.6vw,17px)', lineHeight: 1.9, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {project.description}
            </p>
          </motion.div>
        )}

        {/* Galerie masonry 3 colonnes */}
        {photos.length > 0 && (
          <div style={{ padding: 'clamp(40px,5vw,72px) clamp(20px,5vw,64px) 0' }}>
            <div style={{ columns: '5 150px', gap: '4px' }}>
              {photos.map((photo, i) => (
                <Photo key={photo.id} photo={photo} index={i} onClick={() => setLightbox(i)} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,64px) clamp(64px,8vw,100px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
          borderTop: '0.5px solid rgba(255,255,255,0.05)',
          marginTop: 'clamp(40px,6vw,80px)',
        }}>
          <Link href="/work" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
          >
            {pp.allProjects}
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,22px)', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.06)' }}>
            STUDIØ JRMH
          </div>
        </div>
      </div>

      <style>{`
        .thumb-img { transform: scale(1); }
        .photo-thumb:hover .thumb-img { transform: scale(1.03); }
        .photo-thumb:hover .thumb-overlay { opacity: 1 !important; }
        .photo-thumb:hover .thumb-num { color: rgba(255,255,255,0.4) !important; }
      `}</style>
    </>
  )
}
