'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { apiVerifyEmail, apiResendVerification } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { useLang } from '@/lib/LangContext'

type State = 'loading' | 'success' | 'error' | 'resend'

function VerifyEmailContent() {
  const { t } = useLang()
  const vp = t.verifyEmailPage
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { data: session } = useSession()
  const token = searchParams.get('token')

  const [state, setState]   = useState<State>(token ? 'loading' : 'resend')
  const [message, setMessage] = useState('')
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)

  useEffect(() => {
    if (!token) return

    apiVerifyEmail(token)
      .then(res => { setMessage(res.message); setState('success') })
      .catch(err => { setMessage(err.message); setState('error') })
  }, [token])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    const target = email || session?.client.email || ''
    if (!target) return
    try {
      await apiResendVerification(target)
      setSent(true)
    } catch {}
  }

  return (
    <div className="min-h-screen pt-[80px] px-7 pt-16">
      <motion.div
        className="max-w-[400px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="font-mono text-[9px] tracking-[0.28em] uppercase mb-3" style={{ color: 'rgba(212,168,67,0.8)' }}>
          {vp.label}
        </div>

        {state === 'loading' && (
          <>
            <h1 className="font-bebas text-[48px] tracking-[0.04em] leading-[0.88] mb-6">
              {vp.loadingTitle1}<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(236,232,223,0.35)' }}>
                {vp.loadingTitle2}
              </span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.1em]" style={{ color: 'rgba(236,232,223,0.3)' }}>
              {vp.loadingMsg}
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="font-bebas text-[48px] tracking-[0.04em] leading-[0.88] mb-6">
              {vp.successTitle1}<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(80,160,100,0.6)' }}>
                {vp.successTitle2}
              </span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.08em] mb-8 leading-relaxed" style={{ color: 'rgba(236,232,223,0.4)' }}>
              {message || vp.successFallback}
            </p>
            <Link
              href="/client"
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: 'rgba(212,168,67,0.8)', textDecoration: 'none' }}
            >
              {vp.successCta}
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="font-bebas text-[48px] tracking-[0.04em] leading-[0.88] mb-6">
              {vp.errorTitle1}<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(192,72,48,0.6)' }}>
                {vp.errorTitle2}
              </span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.08em] mb-6 leading-relaxed" style={{ color: 'rgba(192,72,48,0.7)' }}>
              {message || vp.errorFallback}
            </p>
            <button
              onClick={() => setState('resend')}
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: 'rgba(212,168,67,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {vp.resendBtn}
            </button>
          </>
        )}

        {state === 'resend' && (
          <>
            <h1 className="font-bebas text-[48px] tracking-[0.04em] leading-[0.88] mb-6">
              {vp.resendTitle1}<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(236,232,223,0.35)' }}>
                {vp.resendTitle2}
              </span>
            </h1>

            {sent ? (
              <p className="font-mono text-[10px] tracking-[0.08em] leading-relaxed" style={{ color: 'rgba(80,160,100,0.8)' }}>
                {vp.resendSent}
              </p>
            ) : (
              <form onSubmit={handleResend} className="space-y-5">
                <p className="font-mono text-[10px] tracking-[0.06em] leading-relaxed" style={{ color: 'rgba(236,232,223,0.3)' }}>
                  {vp.resendDesc}
                </p>
                {!session?.client.email && (
                  <div>
                    <label className="font-mono text-[8px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'rgba(236,232,223,0.3)' }}>
                      {vp.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent border-b pb-3 font-mono text-[13px] tracking-[0.06em] text-paper outline-none"
                      style={{ borderBottomColor: 'rgba(236,232,223,0.15)', borderBottomWidth: 1 }}
                      placeholder={vp.emailPlaceholder}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="font-mono text-[9px] tracking-[0.22em] uppercase"
                  style={{ color: 'rgba(212,168,67,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {vp.sendLink}
                </button>
              </form>
            )}

            <div className="mt-8">
              <Link href="/client" className="font-mono text-[8px] tracking-[0.15em] uppercase" style={{ color: 'rgba(236,232,223,0.2)', textDecoration: 'none' }}>
                {vp.backDashboard}
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
