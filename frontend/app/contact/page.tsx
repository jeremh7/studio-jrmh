'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { apiContact } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

type FormErrors = Partial<Record<'name' | 'email' | 'message', string>>

export default function ContactPage() {
  const { t } = useLang()
  const cp = t.contactPage

  const [isPending, startTransition] = useTransition()
  const [formErrors, setFormErrors]  = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  function validate(name: string, email: string, message: string): FormErrors {
    const schema = z.object({
      name:    z.string().min(1, cp.errorName),
      email:   z.string().email(cp.errorEmail),
      message: z.string().min(10, cp.errorMessage),
    })
    const result = schema.safeParse({ name, email, message })
    if (result.success) return {}
    const errs: FormErrors = {}
    result.error.issues.forEach(issue => { errs[issue.path[0] as keyof FormErrors] = issue.message })
    return errs
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const form    = e.currentTarget
    const name    = (form.elements.namedItem('name')    as HTMLInputElement).value.trim()
    const email   = (form.elements.namedItem('email')   as HTMLInputElement).value.trim()
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value.trim()
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim()

    const errs = validate(name, email, message)
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setFormErrors({})

    startTransition(async () => {
      try {
        await apiContact({ name, email, subject, message })
        setSuccess(true)
      } catch {
        setServerError(cp.errorServer)
      }
    })
  }

  const fieldStyle = (hasErr: boolean): React.CSSProperties => ({
    width: '100%', background: 'transparent',
    borderBottom: `0.5px solid ${hasErr ? '#c04830' : 'rgba(236,232,223,0.12)'}`,
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    paddingBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.04em', color: '#fff', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
    resize: 'none' as const,
  })

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 8,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(236,232,223,0.3)', marginBottom: 10,
  }

  return (
    <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#080808' }}>

      {/* Fond photo */}
      <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <Image src="/images/contact.jpg" fill priority sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 40%' }} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.82)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, transparent 20%, rgba(8,8,8,0.65) 100%)' }} />
      </div>

      {/* Ghost text */}
      <motion.div aria-hidden="true"
        style={{
          position: 'absolute', bottom: -32, right: -24,
          fontFamily: 'var(--font-display)', fontSize: 'clamp(100px, 20vw, 260px)',
          lineHeight: 0.82, color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.03)',
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.01em',
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.2 }}
      >
        {cp.ghost}
      </motion.div>

      {/* Layout split */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 900,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(40px,6vw,80px)',
        padding: 'clamp(80px,10vh,120px) clamp(20px,5vw,48px)',
        alignItems: 'start',
      }} className="contact-grid">

        {/* Colonne gauche — headline */}
        <div>
          <motion.p
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span style={{ display: 'block', width: 14, height: '0.5px', background: 'rgba(212,168,67,0.7)', flexShrink: 0 }} />
            {cp.label}
          </motion.p>

          <div style={{ overflow: 'hidden', marginBottom: 4 }}>
            <motion.h1
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,8vw,88px)', letterSpacing: '0.03em', lineHeight: 0.88, margin: 0, color: '#fff' }}
              initial={{ y: '105%' }} animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {cp.title1}
            </motion.h1>
          </div>
          <div style={{ overflow: 'hidden', marginBottom: 32 }}>
            <motion.span aria-hidden="true"
              style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,8vw,88px)', letterSpacing: '0.03em', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}
              initial={{ y: '105%' }} animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
            >
              {cp.title2}
            </motion.span>
          </div>

          <motion.p
            style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.85, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', maxWidth: 320, marginBottom: 40 }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            {cp.description}
          </motion.p>

          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          >
            <a href="mailto:studio.jrmh@gmail.com"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(236,232,223,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.35)'}
            >
              {cp.footerLeft}
            </a>
            <a href="https://instagram.com/p.jrmh0" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(236,232,223,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.35)'}
            >
              {cp.footerRight}
            </a>
          </motion.div>
        </div>

        {/* Colonne droite — formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'rgba(8,8,8,0.75)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            padding: 'clamp(28px,4vh,40px) clamp(24px,3vw,36px)',
          }}
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '20px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(92,245,160,0.8)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(92,245,160,0.8)' }}>
                    {cp.successLabel}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', lineHeight: 1.85, color: 'rgba(236,232,223,0.4)', marginBottom: 28 }}>
                  {cp.successMsg}
                </p>
                <button onClick={() => setSuccess(false)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(236,232,223,0.3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,168,67,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,232,223,0.3)'}
                >
                  {cp.successBack}
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
                initial={{ opacity: 1 }}
              >
                <AnimatePresence>
                  {serverError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.08em', color: '#c04830', lineHeight: 1.6 }}>
                      {serverError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Nom */}
                <div>
                  <label htmlFor="name" style={labelStyle}>{cp.nameLabel}</label>
                  <input id="name" name="name" type="text" autoComplete="name" required
                    style={fieldStyle(!!formErrors.name)}
                    placeholder={cp.namePlaceholder}
                    onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                    onBlur={e => e.target.style.borderBottomColor = formErrors.name ? '#c04830' : 'rgba(236,232,223,0.12)'}
                  />
                  <AnimatePresence>
                    {formErrors.name && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>
                        {formErrors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" style={labelStyle}>{cp.emailLabel}</label>
                  <input id="email" name="email" type="email" autoComplete="email" required
                    style={fieldStyle(!!formErrors.email)}
                    placeholder={cp.emailPlaceholder}
                    onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                    onBlur={e => e.target.style.borderBottomColor = formErrors.email ? '#c04830' : 'rgba(236,232,223,0.12)'}
                  />
                  <AnimatePresence>
                    {formErrors.email && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>
                        {formErrors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sujet */}
                <div>
                  <label htmlFor="subject" style={labelStyle}>{cp.subjectLabel}</label>
                  <input id="subject" name="subject" type="text"
                    style={fieldStyle(false)}
                    placeholder={cp.subjectPlaceholder}
                    onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                    onBlur={e => e.target.style.borderBottomColor = 'rgba(236,232,223,0.12)'}
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" style={labelStyle}>{cp.messageLabel}</label>
                  <textarea id="message" name="message" rows={4} required
                    style={{ ...fieldStyle(!!formErrors.message), lineHeight: 1.7 }}
                    placeholder={cp.messagePlaceholder}
                    onFocus={e => e.target.style.borderBottomColor = 'rgba(212,168,67,0.6)'}
                    onBlur={e => e.target.style.borderBottomColor = formErrors.message ? '#c04830' : 'rgba(236,232,223,0.12)'}
                  />
                  <AnimatePresence>
                    {formErrors.message && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c04830', marginTop: 5, letterSpacing: '0.1em' }}>
                        {formErrors.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

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
                  {isPending ? cp.submitting : cp.submit}
                  {!isPending && <span>→</span>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.1); }
        @media (max-width: 680px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
