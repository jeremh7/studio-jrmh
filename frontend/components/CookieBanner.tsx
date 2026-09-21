'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { useLang } from '@/lib/LangContext'

const STORAGE_KEY = 'jrmh-cookie-notice-seen'

export default function CookieBanner() {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage indisponible (navigation privée stricte) — on n'affiche pas la bannière
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* silencieux */ }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label={t.cookieBanner.text}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
            background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderTop: '0.5px solid rgba(255,255,255,0.1)',
            padding: 'clamp(16px,3vw,20px) clamp(20px,5vw,32px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.04em', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 640, flex: '1 1 320px' }}>
            {t.cookieBanner.text}{' '}
            <Link href="/confidentialite" style={{ color: 'rgba(212,168,67,0.8)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              {t.cookieBanner.link}
            </Link>
          </p>
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(8,8,8,0.9)', background: 'rgba(212,168,67,0.85)',
              border: 'none', padding: '11px 22px', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,168,67,1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,168,67,0.85)'}
          >
            {t.cookieBanner.accept}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
