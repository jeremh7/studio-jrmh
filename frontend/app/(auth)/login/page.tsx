'use client'

import { useState, useTransition, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { useLang } from '@/lib/LangContext'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

type FormErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>

function LoginPageContent() {
  const { t } = useLang()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/client'

  const [isPending, startTransition] = useTransition()
  const [formErrors, setFormErrors]  = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [shaking, setShaking]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setFormErrors({})

    const formData = new FormData(e.currentTarget)
    const raw = {
      email:    formData.get('email')    as string,
      password: formData.get('password') as string,
    }

    const parsed = loginSchema.safeParse(raw)
    if (!parsed.success) {
      const errors: FormErrors = {}
      parsed.error.issues.forEach(err => {
        const field = err.path[0] as keyof FormErrors
        errors[field] = field === 'email' ? t.loginPage.errorEmail : t.loginPage.errorPassword
      })
      setFormErrors(errors)
      return
    }

    startTransition(async () => {
      const result = await signIn('credentials', {
        email:    parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError(t.loginPage.errorCredentials)
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#080808' }}>

      {/* ── Photo plein écran ──────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <Image
          src="/images/client.jpg"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          alt=""
        />
        {/* Overlay sombre — lisibilité maximale */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.72)' }} />
        {/* Vignette bords */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,8,8,0.55) 100%)' }} />
      </div>

      {/* ── Grand texte fantôme en fond ───────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -24, left: -16,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(120px, 22vw, 260px)',
          lineHeight: 0.82,
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.04)',
          userSelect: 'none', pointerEvents: 'none',
          letterSpacing: '-0.01em',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.2 }}
      >
        ACCÈS
      </motion.div>

      {/* ── Panel formulaire centré ────────────────────────── */}
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
          {t.loginPage.label}
        </motion.div>

        {/* Titre */}
        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px,7vw,64px)', letterSpacing: '0.04em', lineHeight: 0.88, margin: 0, color: '#fff' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.loginPage.title1}
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 28 }}>
          <motion.span
            aria-hidden="true"
            style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(44px,7vw,64px)', letterSpacing: '0.04em', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.3)' }}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.loginPage.title2}
          </motion.span>
        </div>

        {/* Séparateur */}
        <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

        {/* Formulaire */}
        <motion.div
          animate={shaking ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <AnimatePresence>
              {serverError && (
                <motion.p
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c04830' }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  // {serverError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)', marginBottom: 10 }}>
                {t.loginPage.emailLabel}
              </label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                style={{
                  width: '100%', background: 'transparent',
                  borderBottom: `0.5px solid ${formErrors.email ? '#c04830' : 'rgba(236,232,223,0.12)'}`,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  paddingBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 12,
                  letterSpacing: '0.06em', color: '#fff', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                placeholder={t.loginPage.emailPlaceholder}
                onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                onBlur={e => e.target.style.borderBottomColor = formErrors.email ? '#c04830' : 'rgba(236,232,223,0.12)'}
              />
              {formErrors.email && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>{formErrors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)', marginBottom: 10 }}>
                {t.loginPage.passwordLabel}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                  style={{
                    width: '100%', background: 'transparent',
                    borderBottom: `0.5px solid ${formErrors.password ? '#c04830' : 'rgba(236,232,223,0.12)'}`,
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    paddingBottom: 10, paddingRight: 24, fontFamily: 'var(--font-mono)', fontSize: 12,
                    letterSpacing: showPassword ? '0.06em' : '0.3em', color: '#fff', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  placeholder="••••••••"
                  onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                  onBlur={e => e.target.style.borderBottomColor = formErrors.password ? '#c04830' : 'rgba(236,232,223,0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? t.loginPage.hidePassword : t.loginPage.showPassword}
                  style={{
                    position: 'absolute', right: 0, bottom: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0,
                    color: showPassword ? 'rgba(212,168,67,0.6)' : 'rgba(236,232,223,0.18)',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = showPassword ? 'rgba(212,168,67,0.6)' : 'rgba(236,232,223,0.18)'}
                >
                  {showPassword ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>{formErrors.password}</p>
              )}
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Link href="/forgot-password" style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.18)'}
                >
                  {t.loginPage.forgotPassword}
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              style={{
                marginTop: 8,
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
              {isPending ? t.loginPage.submitting : t.loginPage.submit}
              {!isPending && <span style={{ display: 'inline-block', transition: 'transform 0.15s' }}>→</span>}
            </button>

          </form>
        </motion.div>

        {/* Footer panel */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {t.loginPage.footerLeft}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {t.loginPage.footerRight}
          </span>
        </div>
      </motion.div>

      {/* Indicateur bas */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>STUDIØ.JRMH</span>
      </motion.div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
