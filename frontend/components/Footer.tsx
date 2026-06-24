'use client'
import { useLang } from '@/lib/LangContext'

export default function Footer() {
  const { t } = useLang()

  function handleEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.color = '#fff'
  }

  function handleLeave(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
  }

  return (
    <footer role="contentinfo" style={{ padding: '18px clamp(20px,5vw,32px)', borderTop: '0.5px solid rgba(240,240,240,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <small style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
        {t.footer.copy}
      </small>
      <nav aria-label={t.footer.ariaNav}>
        <ul style={{ display: 'flex', gap: 'clamp(14px,3vw,24px)', listStyle: 'none', padding: 0, margin: 0 }}>
          {t.footer.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.aria} onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}>
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}