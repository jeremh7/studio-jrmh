'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useLang } from '@/lib/LangContext'

export default function NotFound() {
  const { t } = useLang()
  const nf = t.notFoundPage

  return (
    <div style={{ minHeight: '100svh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 clamp(20px,5vw,56px)', overflow: 'hidden', position: 'relative' }}>

      {/* Ghost 404 */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(180px, 35vw, 420px)',
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.025)',
          userSelect: 'none', pointerEvents: 'none',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {nf.ghost}
      </motion.div>

      {/* Contenu centré */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 480 }}>
        <motion.p
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span style={{ display: 'block', width: 14, height: '0.5px', background: 'rgba(212,168,67,0.7)', flexShrink: 0 }} />
          {nf.label}
        </motion.p>

        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 9vw, 88px)', letterSpacing: '0.03em', lineHeight: 0.88, margin: 0, color: '#fff' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {nf.title1}
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 32 }}>
          <motion.span
            aria-hidden="true"
            style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 9vw, 88px)', letterSpacing: '0.03em', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
          >
            {nf.title2}
          </motion.span>
        </div>

        <motion.p
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', lineHeight: 1.8, color: 'rgba(236,232,223,0.3)', marginBottom: 40 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {nf.message}
        </motion.p>

        <motion.div
          style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.5)'}
          >
            {nf.backHome}
          </Link>
          <Link
            href="/work"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(236,232,223,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.25)'}
          >
            {nf.backPortfolio}
          </Link>
        </motion.div>
      </div>

      {/* Brand watermark bas */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
          STUDIØ.JRMH
        </span>
      </motion.div>
    </div>
  )
}
