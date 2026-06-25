'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { apiResetPassword } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

type FormErrors = Partial<Record<'password' | 'confirm', string>>

function ResetPasswordContent() {
  const { t } = useLang()
  const rp = t.resetPasswordPage
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [isPending, startTransition] = useTransition()
  const [formErrors, setFormErrors]  = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!token) {
    return (
      <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c04830' }}>
            {rp.invalidLink}
          </p>
          <Link href="/forgot-password" style={{ display: 'block', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            {rp.requestNew}
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setFormErrors({})

    const formData = new FormData(e.currentTarget)
    const raw = {
      password: formData.get('password') as string,
      confirm:  formData.get('confirm')  as string,
    }

    const schema = z
      .object({
        password: z.string()
          .min(8, { message: rp.errorMin })
          .regex(/[A-Z]/, { message: rp.errorUpper })
          .regex(/[0-9]/, { message: rp.errorDigit }),
        confirm: z.string(),
      })
      .refine((d) => d.password === d.confirm, { message: rp.errorMatch, path: ['confirm'] })

    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const errors: FormErrors = {}
      parsed.error.issues.forEach(err => { errors[err.path[0] as keyof FormErrors] = err.message })
      setFormErrors(errors)
      return
    }

    startTransition(async () => {
      try {
        await apiResetPassword(token, parsed.data.password)
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2500)
      } catch (err) {
        setServerError(err instanceof Error ? err.message : rp.fallbackError)
      }
    })
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', background: 'transparent',
    borderBottom: `0.5px solid ${hasError ? '#c04830' : 'rgba(236,232,223,0.12)'}`,
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    paddingBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.3em', color: '#fff', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
  })

  return (
    <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#080808' }}>

      {/* Photo de fond */}
      <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <Image src="/images/client.jpg" fill priority sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.78)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,8,8,0.55) 100%)' }} />
      </div>

      {/* Ghost text */}
      <motion.div aria-hidden="true"
        style={{
          position: 'absolute', bottom: -24, left: -16,
          fontFamily: 'var(--font-display)', fontSize: 'clamp(120px, 22vw, 260px)',
          lineHeight: 0.82, color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.04)',
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.01em',
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.2 }}
      >
        {rp.ghost}
      </motion.div>

      {/* Panel */}
      <motion.div
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 400,
          padding: 'clamp(36px,5vh,52px) clamp(28px,5vw,44px)',
          background: 'rgba(8,8,8,0.82)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          margin: '0 clamp(16px,4vw,0px)',
        }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Label */}
        <motion.div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span style={{ display: 'block', width: 14, height: '0.5px', background: 'rgba(212,168,67,0.7)', flexShrink: 0 }} />
          {rp.label}
        </motion.div>

        {/* Titre */}
        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,6vw,56px)', letterSpacing: '0.04em', lineHeight: 0.88, margin: 0, color: '#fff' }}
            initial={{ y: '105%' }} animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {rp.title1}
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 28 }}>
          <motion.span aria-hidden="true"
            style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,6vw,56px)', letterSpacing: '0.04em', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.3)' }}
            initial={{ y: '105%' }} animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {rp.title2}
          </motion.span>
        </div>

        <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '16px 0' }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(92,245,160,0.9)', marginBottom: 8 }}>
                {rp.successLabel}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                {rp.successMsg}
              </p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              initial={{ opacity: 1 }}
            >
              <AnimatePresence>
                {serverError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#c04830' }}
                  >
                    // {serverError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Mot de passe */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label htmlFor="password" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)' }}>
                    {rp.passwordLabel}
                  </label>
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPwd ? rp.hidePassword : rp.showPassword}
                  </button>
                </div>
                <input id="password" name="password" type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password" required
                  style={inputStyle(!!formErrors.password)}
                  placeholder="••••••••"
                  onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                  onBlur={e => e.target.style.borderBottomColor = formErrors.password ? '#c04830' : 'rgba(236,232,223,0.12)'}
                />
                <AnimatePresence>
                  {formErrors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>
                      {formErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirmation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label htmlFor="confirm" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)' }}>
                    {rp.confirmLabel}
                  </label>
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showConfirm ? rp.hidePassword : rp.showPassword}
                  </button>
                </div>
                <input id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password" required
                  style={inputStyle(!!formErrors.confirm)}
                  placeholder="••••••••"
                  onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                  onBlur={e => e.target.style.borderBottomColor = formErrors.confirm ? '#c04830' : 'rgba(236,232,223,0.12)'}
                />
                <AnimatePresence>
                  {formErrors.confirm && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>
                      {formErrors.confirm}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Règles */}
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.18)', lineHeight: 1.8 }}>
                {rp.rules}
              </p>

              {/* Submit */}
              <button type="submit" disabled={isPending}
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
                {isPending ? rp.submitting : rp.submit}
                {!isPending && <span>→</span>}
              </button>

              <Link href="/login"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.18)'}
              >
                {rp.backToLogin}
              </Link>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {rp.footerLeft}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)' }}>
            {rp.footerRight}
          </span>
        </div>
      </motion.div>

      {/* Bas de page */}
      <motion.div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
          STUDIØ.JRMH
        </span>
      </motion.div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.1); }`}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
