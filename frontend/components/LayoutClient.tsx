'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Cursor from '@/components/Cursor'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault()
    }
    document.addEventListener('contextmenu', blockContextMenu)
    return () => document.removeEventListener('contextmenu', blockContextMenu)
  }, [])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisRef.current = lenis
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  function handleSkipFocus(e: React.FocusEvent<HTMLAnchorElement>) {
    e.currentTarget.style.top = '0'
  }

  function handleSkipBlur(e: React.FocusEvent<HTMLAnchorElement>) {
    e.currentTarget.style.top = '-56px'
  }

  return (
    <>
      <a
        href="#contenu-principal"
        onFocus={handleSkipFocus}
        onBlur={handleSkipBlur}
        style={{
          position: 'absolute', top: -56, left: 0, zIndex: 10000,
          background: '#fff', color: '#080808', fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: '0.1em', padding: '12px 20px',
          textDecoration: 'none', fontWeight: 700, transition: 'top 0.2s',
        }}
      >
        Aller au contenu principal
      </a>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
      />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Nav />
      <main id="contenu-principal" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}