'use client'

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { apiForgotPassword } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

const schema = z.object({
  email: z.string().email(),
})

function ForgotPasswordContent() {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [emailError, setEmailError]  = useState<string | null>(null)
  const [sent, setSent]              = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailError(null)

    const formData = new FormData(e.currentTarget)
    const raw      = { email: formData.get('email') as string }

    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      setEmailError(t.forgotPage.errorEmail)
      return
    }

    startTransition(async () => {
      try {
        await apiForgotPassword(parsed.data.email)
      } catch {
        // Réponse générique — toujours afficher le succès
      } finally {
        setSent(true)
      }
    })
  }

  return (
    <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#080808' }}>

      {/* Photo de fond */}
      <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <Image
          src="/images/client.jpg"
          fill priority sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          alt=""
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.76)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,8,8,0.6) 100%)' }} />
      </div>

      {/* Ghost text */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: -24, left: -16,
          fontFamily: 'var(--font-display)', fontSize: 'clamp(100px, 20vw, 240px)',
          lineHeight: 0.82, color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.035)',
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.01em',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.2 }}
      >
        {t.forgotPage.ghost}
      </motion.div>

      {/* Panel */}
      <motion.div
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 400,
          padding: 'clamp(36px,5vh,52px) clamp(28px,5vw,44px)',
          background: 'rgba(8,8,8,0.82)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          margin: '0 clamp(16px,4vw,0px)',
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Label */}
        <motion.div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span style={{ display: 'block', width: 14, height: '0.5px', background: 'rgba(212,168,67,0.7)', flexShrink: 0 }} />
          {t.forgotPage.label}
        </motion.div>

        {/* Titre */}
        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,60px)', letterSpacing: '0.04em', lineHeight: 0.88, margin: 0, color: '#fff' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.forgotPage.title1}
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 28 }}>
          <motion.span
            aria-hidden="true"
            style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,60px)', letterSpacing: '0.04em', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.3)' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.forgotPage.title2}
          </motion.span>
        </div>

        <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

        <AnimatePresence mode="wait">
          {sent ? (
            /* ── État succès ── */
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(92,245,160,0.7)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(92,245,160,0.7)' }}>
                  {t.forgotPage.sentLabel}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', lineHeight: 1.85, color: 'rgba(236,232,223,0.4)', margin: 0 }}>
                {t.forgotPage.sentMsg}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.06em', lineHeight: 1.7, color: 'rgba(236,232,223,0.22)', margin: 0 }}>
                {t.forgotPage.sentTip}
              </p>
              <Link
                href="/login"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.4)'}
              >
                {t.forgotPage.backToLogin}
              </Link>
            </motion.div>
          ) : (
            /* ── Formulaire ── */
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              noValidate
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.06em', lineHeight: 1.85, color: 'rgba(236,232,223,0.3)', margin: 0 }}>
                {t.forgotPage.description}
              </p>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)', marginBottom: 10 }}>
                  {t.forgotPage.emailLabel}
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  style={{
                    width: '100%', background: 'transparent',
                    borderBottom: `0.5px solid ${emailError ? '#c04830' : 'rgba(236,232,223,0.12)'}`,
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    paddingBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 12,
                    letterSpacing: '0.06em', color: '#fff', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  placeholder={t.forgotPage.emailPlaceholder}
                  onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                  onBlur={e => e.target.style.borderBottomColor = emailError ? '#c04830' : 'rgba(236,232,223,0.12)'}
                />
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 6, letterSpacing: '0.1em' }}
                    >
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: isPending ? 'rgba(236,232,223,0.3)' : 'rgba(236,232,223,0.5)',
                  background: 'none', border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'color 0.15s', padding: 0,
                }}
                onMouseEnter={e => { if (!isPending) e.currentTarget.style.color = 'rgba(212,168,67,0.9)' }}
                onMouseLeave={e => e.currentTarget.style.color = isPending ? 'rgba(236,232,223,0.3)' : 'rgba(236,232,223,0.5)'}
              >
                {isPending ? t.forgotPage.submitting : t.forgotPage.submit}
                {!isPending && <span>→</span>}
              </button>

              <Link
                href="/login"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.18)'}
              >
                {t.forgotPage.backToLogin}
              </Link>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {t.forgotPage.footerLeft}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {t.forgotPage.footerRight}
          </span>
        </div>
      </motion.div>

      {/* Bas de page */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
          STUDIØ.JRMH
        </span>
      </motion.div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.1); }`}</style>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}
