'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import gsap from 'gsap'
import { useLang } from '@/lib/LangContext'

export default function Nav() {
  const { t, toggle }              = useLang()
  const path                       = usePathname()
  const { data: session, status }  = useSession()
  const isLoggedIn                 = status === 'authenticated'
  const isLoading                  = status === 'loading'

  const navRef        = useRef<HTMLElement>(null)
  const logoRef       = useRef<HTMLAnchorElement>(null)
  const linksRef      = useRef<HTMLUListElement>(null)
  const ctaRef        = useRef<HTMLAnchorElement>(null)
  const menuBtnRef    = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // ── Liens communs (toujours visibles) ───────────────────────
  const publicLinks = [
    { href: '/',         label: t.nav.home    },
    { href: '/work',     label: t.nav.work    },
    { href: '/about',    label: t.nav.about   },
    { href: '/contact',  label: t.nav.contact },
  ]

  // ── Liens supplémentaires si connecté ───────────────────────
  const clientLinks = isLoggedIn
    ? [{ href: '/client', label: t.nav.client ?? 'Galeries' }]
    : []

  const allLinks = [...publicLinks, ...clientLinks]

  // ── Animations init ─────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(logoRef.current,  { opacity: 0, x: -20, duration: 0.7 }, 0.3)
      tl.from(linksRef.current?.querySelectorAll('li') ?? [], { opacity: 0, y: -12, stagger: 0.07, duration: 0.6 }, 0.4)
      tl.from(ctaRef.current,   { opacity: 0, x: 20, duration: 0.7 }, 0.4)
      tl.from(menuBtnRef.current, { opacity: 0, duration: 0.5 }, 0.4)
    }, navRef)
    return () => ctx.revert()
  }, [])

  // ── Scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    gsap.to(navRef.current, {
      backgroundColor: scrolled ? 'rgba(8,8,8,0.92)' : 'rgba(8,8,8,0)',
      duration: 0.4, ease: 'power2.out',
    })
  }, [scrolled])

  // ── Menu mobile ─────────────────────────────────────────────
  useEffect(() => {
    if (!mobileMenuRef.current) return
    if (menuOpen) {
      gsap.set(mobileMenuRef.current, { display: 'flex' })
      gsap.fromTo(mobileMenuRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.from(mobileMenuRef.current.querySelectorAll('.mob-link'), { opacity: 0, x: -24, stagger: 0.06, duration: 0.45, ease: 'expo.out', delay: 0.05 })
      gsap.from(mobileMenuRef.current.querySelector('.mob-footer'), { opacity: 0, y: 12, duration: 0.4, ease: 'power2.out', delay: 0.3 })
      document.body.style.overflow = 'hidden'
    } else {
      gsap.to(mobileMenuRef.current, {
        opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: () => { if (mobileMenuRef.current) gsap.set(mobileMenuRef.current, { display: 'none' }) },
      })
      document.body.style.overflow = ''
      menuBtnRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) { setMenuOpen(false); toggleBurger(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
    if (!menuBtnRef.current) return
    const bars = menuBtnRef.current.querySelectorAll<HTMLSpanElement>('.bar')
    gsap.to(bars[0], { y: 0, rotate: 0, duration: 0.3, ease: 'expo.out' })
    gsap.to(bars[1], { opacity: 1, scaleX: 1, duration: 0.3 })
    gsap.to(bars[2], { y: 0, rotate: 0, duration: 0.3, ease: 'expo.out' })
  }, [path])

  const toggleBurger = (open: boolean) => {
    if (!menuBtnRef.current) return
    const bars = menuBtnRef.current.querySelectorAll<HTMLSpanElement>('.bar')
    if (open) {
      gsap.to(bars[0], { y: 5.5, rotate: 45,  duration: 0.3, ease: 'expo.out' })
      gsap.to(bars[1], { opacity: 0, scaleX: 0, duration: 0.2 })
      gsap.to(bars[2], { y: -5.5, rotate: -45, duration: 0.3, ease: 'expo.out' })
    } else {
      gsap.to(bars[0], { y: 0, rotate: 0, duration: 0.3, ease: 'expo.out' })
      gsap.to(bars[1], { opacity: 1, scaleX: 1, duration: 0.3 })
      gsap.to(bars[2], { y: 0, rotate: 0, duration: 0.3, ease: 'expo.out' })
    }
  }

  const handleMenu = () => {
    const next = !menuOpen
    setMenuOpen(next)
    toggleBurger(next)
  }

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 32px); height: 60px;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; margin: 0; padding: 0; }
        .nav-right  { display: flex; align-items: center; gap: 16px; }
        .nav-cta    { display: flex; }
        .nav-burger {
          display: none; flex-direction: column; justify-content: center;
          align-items: center; gap: 5px; background: none; border: none;
          cursor: pointer; padding: 4px; width: 44px; height: 44px;
        }
        .nav-burger:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .nav-burger .bar { display: block; width: 22px; height: 1px; background: #fff; transform-origin: center; }
        .nav-link-item {
          font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; text-decoration: none;
          color: rgba(255,255,255,0.4); position: relative; display: inline-block;
          transition: color 0.15s; padding-bottom: 3px; border-bottom: 0.5px solid transparent;
        }
        .nav-link-item:hover { color: rgba(255,255,255,0.8); }
        .nav-link-item[aria-current="page"] { color: #fff; border-bottom-color: #fff; }
        .nav-link-item:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
        .lang-btn {
          font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          background: none; border: 0.5px solid rgba(255,255,255,0.14);
          padding: 6px 10px; cursor: pointer; transition: color 0.15s, border-color 0.15s;
          min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
        }
        .lang-btn:hover { color: #fff; border-color: rgba(255,255,255,0.45); }
        .lang-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .nav-signout {
          font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.2);
          background: none; border: none; cursor: pointer; transition: color 0.15s; padding: 4px 2px;
        }
        .nav-signout:hover { color: rgba(255,255,255,0.6); }
        @media (max-width: 768px) {
          .nav-links        { display: none !important; }
          .nav-cta          { display: none !important; }
          .nav-signout      { display: none !important; }
          .nav-burger       { display: flex !important; }
          .lang-btn-desktop { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-link-item, .nav-root { transition: none !important; }
        }
      `}</style>

      <nav ref={navRef} className="nav-root" aria-label={t.nav.ariaNav}>

        {/* Logo */}
        <Link
          ref={logoRef}
          href="/"
          aria-label={t.nav.ariaLogo}
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.22em', color: '#fff', textDecoration: 'none', flexShrink: 0 }}
          onMouseEnter={e => gsap.to(e.currentTarget, { letterSpacing: '0.28em', duration: 0.3, ease: 'power2.out' })}
          onMouseLeave={e => gsap.to(e.currentTarget, { letterSpacing: '0.22em', duration: 0.3, ease: 'power2.out' })}
        >
          P.JRMH
        </Link>

        {/* Liens desktop */}
        <ul ref={linksRef} className="nav-links" role="list">
          {allLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="nav-link-item"
                aria-current={path === href ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Droite */}
        <div className="nav-right">
          {/* CTA principal */}
          {!isLoading && (
            isLoggedIn ? (
              /* Connecté → prénom + lien espace client */
              <Link
                ref={ctaRef}
                href="/client"
                className="nav-cta"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.3)',
                  padding: '7px 14px', transition: 'color 0.15s, border-color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
              >
                {session?.client?.firstName ?? 'Mon espace'}
              </Link>
            ) : (
              /* Non connecté → accès client → /login */
              <Link
                ref={ctaRef}
                href="/login"
                className="nav-cta"
                aria-label={t.nav.ariaClient}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.14)',
                  padding: '7px 14px', transition: 'color 0.15s, border-color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
              >
                {t.nav.access}
              </Link>
            )
          )}

          {/* Bouton déconnexion discret — visible si connecté */}
          {isLoggedIn && (
            <button
              className="nav-signout"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Se déconnecter"
            >
              ×
            </button>
          )}

          {/* Langue — desktop */}
          <button
            className="lang-btn lang-btn-desktop"
            onClick={toggle}
            aria-label={t.lang.switchLabel}
            title={t.lang.switchLabel}
          >
            {t.lang.switch}
          </button>

          {/* Burger mobile */}
          <button
            ref={menuBtnRef}
            className="nav-burger"
            onClick={handleMenu}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="bar" aria-hidden="true" />
            <span className="bar" aria-hidden="true" />
            <span className="bar" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* ── Overlay mobile ───────────────────────────────────────── */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.ariaMobile}
        style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 99, background: '#080808', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px, 6vw, 40px)' }}
      >
        {/* En-tête */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', padding: '0 clamp(20px, 5vw, 32px)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.22em', color: '#fff' }}>P.JRMH</span>
        </div>

        {/* Liens */}
        <nav aria-label={t.nav.ariaMobile}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allLinks.map(({ href, label }, i) => (
              <li key={href} className="mob-link">
                <Link
                  href={href}
                  aria-current={path === href ? 'page' : undefined}
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 12vw, 62px)', letterSpacing: '0.04em', color: path === href ? '#fff' : 'rgba(255,255,255,0.25)', textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 16, lineHeight: 1.15, transition: 'color 0.15s', padding: '4px 0' }}
                  onMouseEnter={e => { if (path !== href) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                  onMouseLeave={e => { if (path !== href) e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                >
                  <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', alignSelf: 'center' }}>
                    0{i + 1}
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer mobile */}
        <div className="mob-footer" style={{ position: 'absolute', bottom: 'clamp(28px, 6vw, 40px)', left: 'clamp(20px, 5vw, 32px)', right: 'clamp(20px, 5vw, 32px)' }}>
          <div style={{ height: 0.5, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            {/* CTA ou déconnexion */}
            {isLoggedIn ? (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Déconnexion
              </button>
            ) : (
              <Link
                href="/login"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                {t.nav.access}
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className="lang-btn"
                onClick={toggle}
                aria-label={t.lang.switchLabel}
                title={t.lang.switchLabel}
                style={{ minHeight: 36, minWidth: 36, padding: '4px 10px', fontSize: 8 }}
              >
                {t.lang.switch}
              </button>
              <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)' }}>
                © 2025 JRMH
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}