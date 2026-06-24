'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { useLang } from '@/lib/LangContext'

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  const { t } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const photoRef     = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: photoRef, offset: ['start end', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <div ref={containerRef} style={{ background: '#080808', minHeight: '100vh' }}>

      {/* ── Hero split ─────────────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100svh' }} className="about-hero-grid">

        {/* Colonne gauche — texte */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(100px,12vh,140px) clamp(20px,5vw,48px) clamp(40px,6vh,64px)', position: 'relative', zIndex: 10 }}>

          {/* BG ghost text */}
          <motion.div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 60, left: -12,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(80px, 14vw, 160px)',
              lineHeight: 0.82,
              color: 'transparent',
              WebkitTextStroke: '1px rgba(240,240,240,0.04)',
              userSelect: 'none', pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.1 }}
          >
            SPORT<br />PHOTO<br />GRAPH
          </motion.div>

          {/* Label */}
          <motion.p
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.85)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span aria-hidden="true" style={{ display: 'block', width: 20, height: 1, background: 'rgba(212,168,67,0.7)', flexShrink: 0 }} />
            {t.aboutPage.label}
          </motion.p>

          {/* Nom */}
          <h1 style={{ margin: '0 0 32px', lineHeight: 0.88 }}>
            <div style={{ overflow: 'hidden' }}>
              <motion.span
                style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(64px, 11vw, 108px)', letterSpacing: '0.03em', color: '#fff' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              >
                JÉRÉMY
              </motion.span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.span
                aria-hidden="true"
                style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(64px, 11vw, 108px)', letterSpacing: '0.03em', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.38)' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
              >
                HORDÉ
              </motion.span>
            </div>
          </h1>

          {/* Bio */}
          <motion.p
            style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.5vw,14px)', lineHeight: 1.85, color: 'rgba(255,255,255,0.62)', fontStyle: 'italic', maxWidth: 360, marginBottom: 36 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.aboutPage.bio}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <Link
              href="/work"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#080808', background: '#fff', padding: '12px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0ddd8'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {t.aboutPage.cta}
            </Link>
          </motion.div>
        </div>

        {/* Colonne droite — photo */}
        <div ref={photoRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '100svh' }} className="about-photo-col">
          <motion.div style={{ position: 'absolute', inset: '-10%', y: photoY }}>
            <Image
              src="/images/profil.jpg"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
              alt="Jérémy Hordé — photographe sport et portrait"
            />
          </motion.div>

          {/* Gradient overlay */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #080808 0%, rgba(8,8,8,0.5) 35%, rgba(8,8,8,0.1) 100%)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.7) 0%, transparent 40%)' }} />

          {/* Badge coin */}
          <span aria-hidden="true" style={{ position: 'absolute', top: 80, right: 24, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', border: '0.5px solid rgba(255,255,255,0.12)', padding: '5px 10px' }}>
            STUDIØ.JRMH
          </span>

          {/* Scroll indicator */}
          <motion.div
            style={{ position: 'absolute', bottom: 32, right: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              style={{ width: 0.5, background: 'rgba(255,255,255,0.2)' }}
              initial={{ height: 0 }}
              animate={{ height: 36 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>{t.aboutPage.scroll}</span>
          </motion.div>
        </div>
      </section>

      {/* ── Disciplines ────────────────────────────────────────── */}
      <section style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: 'clamp(48px,7vw,72px) clamp(20px,5vw,48px)' }}>
        <Reveal>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.7)', marginBottom: 32 }}>
            {t.aboutPage.disciplinesLabel}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {t.aboutPage.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em',
                  textTransform: 'uppercase', padding: '8px 16px',
                  color: 'rgba(255,255,255,0.45)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <section style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: 'clamp(48px,7vw,72px) clamp(20px,5vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,6vw,80px)' }} className="about-contact-grid">
        <div>
          <Reveal>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,72px)', letterSpacing: '0.04em', lineHeight: 0.9, margin: '0 0 32px' }}>
              {t.aboutPage.contactTitle1}<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.32)' }}>
                {t.aboutPage.contactTitle2}
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', maxWidth: 320 }}>
              {t.aboutPage.contactBody}
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          {[
            { label: t.aboutPage.contactEmail,         value: 'studio.jrmh@gmail.com', href: 'mailto:studio.jrmh@gmail.com' },
            { label: t.aboutPage.contactInstagram,     value: '@p.jrmh0',              href: 'https://instagram.com/p.jrmh0' },
            { label: t.aboutPage.contactLocationLabel, value: t.aboutPage.contactLocationValue, href: null },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.08}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, paddingBottom: 16, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', minWidth: 80 }}>
                  {item.label}
                </span>
                {item.href ? (
                  <a href={item.href} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    {item.value}
                  </a>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)' }}>
                    {item.value}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <style>{`
        .about-hero-grid   { grid-template-columns: 1fr 1fr; }
        .about-photo-col   { display: block; }
        .about-contact-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .about-hero-grid    { grid-template-columns: 1fr !important; }
          .about-photo-col    { min-height: 75vw !important; order: -1; }
          .about-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
