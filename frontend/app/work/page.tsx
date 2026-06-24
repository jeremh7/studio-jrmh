'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'motion/react'
import { getProjects, type Project, CATEGORIES } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function absUrl(src: string): string {
  if (!src) return ''
  if (src.startsWith('http')) return src
  return `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`
}

// ── Carte projet ──────────────────────────────────────────────
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const { t } = useLang()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/work/${project.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="project-card">
          {/* Cover */}
          <div style={{ position: 'relative', aspectRatio: '3/4', background: '#0a0a0a', overflow: 'hidden' }}>
            {project.coverImage ? (
              <Image
                src={absUrl(project.coverImage)}
                fill
                sizes="(max-width:600px) 100vw, (max-width:1024px) 50vw, 33vw"
                style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }}
                alt={project.title}
                className="card-img"
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.04)' }}>
                  {project.categoryLabel.toUpperCase()}
                </span>
              </div>
            )}

            {/* Overlay hover */}
            <div className="card-overlay" style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(8,8,8,0.82) 0%, transparent 55%)',
              opacity: 0, transition: 'opacity 0.3s',
            }} />

            {/* Label hover */}
            <div className="card-label" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '40px 16px 16px',
              opacity: 0, transition: 'opacity 0.3s',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                {t.portfolio.seeProject}
              </span>
            </div>

            {/* Badge featured */}
            {project.featured && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(8,8,8,0.7)',
                border: '0.5px solid rgba(212,168,67,0.4)',
                padding: '3px 8px',
                fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.15em',
                color: 'rgba(212,168,67,0.9)',
              }}>★</div>
            )}
          </div>

          {/* Infos */}
          <div style={{ padding: '12px 2px 28px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(212,168,67,0.6)',
              marginBottom: 5, display: 'flex', gap: 10, alignItems: 'center',
            }}>
              {project.categoryLabel}
              {project.eventDate && (
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>{project.eventDate}</span>
              )}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px,2.2vw,24px)',
              letterSpacing: '0.04em', color: '#fff', lineHeight: 0.95,
            }}>
              {project.title.toUpperCase()}
            </div>
            {project.location && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.2)', marginTop: 6,
              }}>
                {project.location}
              </div>
            )}
          </div>

          {/* Ligne or au hover */}
          <div className="card-line" style={{ height: '1px', background: 'rgba(212,168,67,0)', transition: 'background 0.3s' }} />
        </div>
      </Link>
    </motion.div>
  )
}

// ── Page Work ─────────────────────────────────────────────────
export default function WorkPage() {
  const { t } = useLang()
  const [projects, setProjects]       = useState<Project[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeCategory, setCategory] = useState('all')

  useEffect(() => {
    setLoading(true)
    getProjects(activeCategory).then(data => { setProjects(data); setLoading(false) })
  }, [activeCategory])

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: 60 }}>

      {/* Ghost texte de fond */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, right: -20, zIndex: 0, pointerEvents: 'none', userSelect: 'none',
        fontFamily: 'var(--font-display)', fontSize: 'clamp(120px, 18vw, 200px)', lineHeight: 0.85,
        color: 'transparent', WebkitTextStroke: '1px rgba(240,240,240,0.015)', textAlign: 'right',
      }}>
        PORT<br />FOLIO
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px) 0' }}>
          <motion.div
            style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.7)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span style={{ display: 'block', width: 20, height: '0.5px', background: 'rgba(212,168,67,0.6)' }} />
            {t.portfolio.label}
          </motion.div>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,10vw,100px)', letterSpacing: '0.04em', lineHeight: 0.88, margin: 0 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.portfolio.title}
          </motion.h1>
        </div>

        {/* Filtres catégories */}
        <motion.div
          style={{
            padding: '32px clamp(20px,5vw,48px) 0',
            display: 'flex', gap: 'clamp(20px,3vw,36px)', flexWrap: 'wrap',
            borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase',
                background: 'none', border: 'none', cursor: 'pointer',
                paddingBottom: 14, paddingLeft: 0, paddingRight: 0,
                color: activeCategory === c ? '#fff' : 'rgba(255,255,255,0.3)',
                borderBottom: activeCategory === c ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              {t.portfolio.categories[c]}
            </button>
          ))}
        </motion.div>

        {/* Grille */}
        <div style={{ padding: 'clamp(24px,4vw,40px) clamp(20px,5vw,48px) 80px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
              {t.portfolio.loading}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,8vw,80px)', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.06)', marginBottom: 20 }}>
                {t.portfolio.emptyGhost}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>
                {t.portfolio.emptyMsg}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px,26vw,300px), 1fr))',
              gap: 'clamp(16px,2vw,28px)',
            }}>
              {projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .card-img { transform: scale(1); }
        .project-card:hover .card-img { transform: scale(1.05); }
        .project-card:hover .card-overlay { opacity: 1 !important; }
        .project-card:hover .card-label { opacity: 1 !important; }
        .project-card:hover .card-line { background: rgba(212,168,67,0.4) !important; }
      `}</style>
    </div>
  )
}
