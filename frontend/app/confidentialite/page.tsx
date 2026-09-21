'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useLang } from '@/lib/LangContext'

export default function PrivacyPage() {
  const { t } = useLang()
  const p = t.privacyPage

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: 60 }}>

      {/* Ghost texte de fond */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, right: -20, zIndex: 0, pointerEvents: 'none', userSelect: 'none',
        fontFamily: 'var(--font-display)', fontSize: 'clamp(100px, 16vw, 180px)', lineHeight: 0.85,
        color: 'transparent', WebkitTextStroke: '1px rgba(240,240,240,0.015)', textAlign: 'right',
      }}>
        RGPD
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,32px) 100px' }}>

        <motion.div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.75)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        >
          <span style={{ display: 'block', width: 20, height: '0.5px', background: 'rgba(212,168,67,0.6)' }} />
          {p.label}
        </motion.div>

        <motion.h1
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,64px)', letterSpacing: '0.04em', lineHeight: 0.9, margin: 0, color: '#fff' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
        >
          {p.title}
        </motion.h1>
        <motion.h1
          aria-hidden="true"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,64px)', letterSpacing: '0.04em', lineHeight: 0.9, margin: 0, color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
        >
          {p.title2}
        </motion.h1>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', marginTop: 24, marginBottom: 48 }}>
          {p.updated}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {p.sections.map((section, i) => (
            <motion.section key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.3) }}
            >
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.85)', marginBottom: 10 }}>
                {section.heading}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.85, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                {section.body}
              </p>
            </motion.section>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 28, borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            {p.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
