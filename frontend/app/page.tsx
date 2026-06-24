"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useLang } from "@/lib/LangContext";

function Reveal({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

const GRID_IMAGES = [
  "/images/accueil-04.jpg",
  "/images/accueil-05.jpg",
  "/images/accueil-02.jpg",
  "/images/accueil-01.jpg",
  "/images/accueil-03.jpg",
];

function PhotoBlock({ alt = "", style = {}, index = 0 }: { alt?: string; style?: React.CSSProperties; index?: number }) {
  return (
    <div style={{ background: "#111", overflow: "hidden", position: "relative", ...style }}>
      <Image src={GRID_IMAGES[index % GRID_IMAGES.length]} fill style={{ objectFit: "cover" }} alt={alt} />
    </div>
  );
}

function TagScroll() {
  const { t } = useLang();
  return (
    <div aria-hidden="true" style={{ overflow: "hidden", borderTop: "0.5px solid rgba(240,240,240,0.08)", borderBottom: "0.5px solid rgba(240,240,240,0.08)", padding: "11px 0" }}>
      <motion.div style={{ display: "flex", gap: 48, whiteSpace: "nowrap" }} animate={{ x: ["0%", "-50%"] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
        {[...t.tags, ...t.tags].map((tag, i) => (
          <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: i % 2 === 0 ? "rgba(240,240,240,0.5)" : "rgba(240,240,240,0.18)" }}>{tag}</span>
        ))}
      </motion.div>
    </div>
  );
}

function Hero() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section ref={ref} aria-labelledby="hero-titre" style={{ position: "relative", minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <Image src="/images/hero.jpg" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.72) 38%, rgba(8,8,8,0.2) 65%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,8,8,0.45) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.22)" }} />
      </div>

      <motion.div aria-hidden="true" className="hero-bg-type" style={{ position: "absolute", top: -20, left: -16, fontFamily: "var(--font-display)", lineHeight: 0.82, letterSpacing: "-0.01em", color: "transparent", WebkitTextStroke: "1px rgba(240,240,240,0.055)", userSelect: "none", pointerEvents: "none", zIndex: 1 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.1 }}>
        SPORT<br />PHOTO<br />GRAPH
      </motion.div>

      <div style={{ position: "relative", zIndex: 10, padding: "0 clamp(20px, 5vw, 32px) clamp(40px, 6vh, 56px)" }}>
        <motion.p style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontFamily: "var(--font-mono)", fontSize: "clamp(8px, 2vw, 9px)", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
          <span aria-hidden="true" style={{ display: "block", width: 20, height: 1, background: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
          {t.hero.label}
        </motion.p>

        {/* ── FIX : deux blocs overflow séparés pour le reveal ligne par ligne ── */}
        <h1 id="hero-titre" aria-label={`${t.hero.name} Hordé`} style={{ margin: 0 }}>
          <div style={{ overflow: "hidden" }}>
            <motion.span
              style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "clamp(58px, 13vw, 108px)", lineHeight: 0.9, letterSpacing: "0.025em", color: "#FFFFFF" }}
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {t.hero.name}
            </motion.span>
          </div>
          <div style={{ overflow: "hidden" }}>
            <motion.span
              aria-hidden="true"
              style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "clamp(58px, 13vw, 108px)", lineHeight: 0.9, letterSpacing: "0.025em", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.48)" }}
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.82, ease: [0.16, 1, 0.3, 1] }}
            >
              HORDÉ
            </motion.span>
          </div>
        </h1>

        <motion.nav aria-label={t.hero.label} style={{ display: "flex", gap: "clamp(14px, 3vw, 28px)", marginTop: "clamp(20px, 3vh, 28px)", flexWrap: "wrap" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }}>
          <Link href="/work" style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(8px, 2vw, 9px)", letterSpacing: "0.22em", textTransform: "uppercase", color: "#fff", background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.28)", padding: "11px 20px", textDecoration: "none", transition: "background 0.15s, border-color 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)" }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)" }}>
            {t.hero.cta1}
          </Link>
          <Link href="/client" style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(8px, 2vw, 9px)", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)", textDecoration: "none", transition: "color 0.15s", padding: "11px 0", display: "flex", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.72)"}>
            {t.hero.cta2}
          </Link>
        </motion.nav>
      </div>

      <motion.div aria-hidden="true" style={{ position: "absolute", bottom: 28, right: "clamp(16px, 4vw, 32px)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, zIndex: 10 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        <motion.div style={{ width: 0.5, background: "rgba(240,240,240,0.22)", alignSelf: "center" }} initial={{ height: 0 }} animate={{ height: 32 }} transition={{ duration: 0.8, delay: 1.5 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,240,240,0.2)" }}>{t.hero.scroll}</span>
      </motion.div>
    </section>
  );
}

function WorkGrid() {
  const { t } = useLang();
  const desktopItems = [
    { ...t.work.items[0], col: "1 / span 1", row: "1 / span 2" },
    { ...t.work.items[1], col: "2 / span 1", row: "1 / span 1" },
    { ...t.work.items[2], col: "2 / span 1", row: "2 / span 1" },
    { ...t.work.items[3], col: "3 / span 1", row: "1 / span 1" },
    { ...t.work.items[4], col: "3 / span 1", row: "2 / span 1" },
  ];

  return (
    <section aria-labelledby="portfolio-titre" style={{ padding: "0 0 2px" }}>
      <Reveal>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "clamp(32px,5vw,48px) clamp(20px,5vw,32px) clamp(16px,2vw,24px)" }}>
          <h2 id="portfolio-titre" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,7vw,64px)", letterSpacing: "0.04em", color: "#FFFFFF", margin: 0 }}>{t.work.title}</h2>
          <Link href="/work" aria-label={t.work.ariaAll} style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", transition: "color 0.15s", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>{t.work.seeAll}</Link>
        </div>
      </Reveal>

      {/* Desktop */}
      <ul
        className="work-desktop"
        aria-label={t.work.ariaAll}
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 3, background: "#0a0a0a", padding: 3, listStyle: "none", margin: 0, aspectRatio: "3 / 2" }}
      >
        {desktopItems.map((item, i) => (
          <li key={i} style={{ gridColumn: item.col, gridRow: item.row, minHeight: 0 }}>
            <motion.div
              className="grid-card"
              style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
            >
              <Link href="/work" aria-label={item.tag} style={{ display: "block", width: "100%", height: "100%", position: "relative", textDecoration: "none" }}>
                {/* Image avec léger zoom au hover */}
                <div className="grid-img" style={{ position: "absolute", inset: 0, transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)" }}>
                  <PhotoBlock alt={item.tag} index={i} style={{ width: "100%", height: "100%" }} />
                </div>
                {/* Overlay gradient */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(8,8,8,0.82))", pointerEvents: "none", transition: "opacity 0.3s" }} />
                {/* Texte bas */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 14px 16px", pointerEvents: "none", overflow: "hidden" }}>
                  {/* Tag */}
                  <span className="grid-tag" style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 7.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 4, transition: "opacity 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                    {item.tag}
                  </span>
                  {/* Titre qui monte */}
                  <div style={{ overflow: "hidden" }}>
                    <span className="grid-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.05em", color: "#fff", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                      {item.title}
                    </span>
                  </div>
                  {/* "Voir plus →" qui apparaît */}
                  <div style={{ overflow: "hidden" }}>
                    <span className="grid-cta" style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(212,168,67,0.9)", marginTop: 8, transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                      Voir plus →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </li>
        ))}
      </ul>

      {/* Mobile */}
      <ul
        className="work-mobile"
        aria-label={t.work.ariaAll}
        style={{ display: "none", gridTemplateColumns: "1fr 1fr", gap: 3, background: "#0a0a0a", padding: 3, listStyle: "none", margin: 0 }}
      >
        {t.work.items.slice(0, 4).map((item, i) => (
          <li key={i} style={{ aspectRatio: "1 / 1" }}>
            <Link href="/work" aria-label={item.tag} style={{ position: "relative", display: "block", width: "100%", height: "100%", overflow: "hidden", textDecoration: "none" }}>
              <motion.div style={{ width: "100%", height: "100%", position: "relative" }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }}>
                <PhotoBlock alt={item.tag} index={i} style={{ width: "100%", height: "100%" }} />
              </motion.div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 12px 12px", background: "linear-gradient(transparent, rgba(8,8,8,0.82))", pointerEvents: "none" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 3 }}>{item.tag}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#fff" }}>{item.title}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <style>{`
        .hero-bg-type { font-size: clamp(90px, 20vw, 220px); }
        .work-desktop { display: grid !important; }
        .work-mobile  { display: none !important; }
        .grid-cta  { transform: translateY(110%); }
        .grid-card:hover .grid-img   { transform: scale(1.04); }
        .grid-card:hover .grid-title { transform: translateY(-110%); }
        .grid-card:hover .grid-cta   { transform: translateY(0%); }
        .grid-card:hover .grid-tag   { opacity: 0; transform: translateY(-6px); }
        .about-strip  { grid-template-columns: 1fr 1fr; }
        .about-photo  { height: 420px; }
        @media (max-width: 768px) {
          .hero-bg-type { display: none; }
          .about-strip  { grid-template-columns: 1fr !important; }
          .about-photo  { height: 280px !important; }
          .work-desktop { display: none !important; }
          .work-mobile  { display: grid !important; }
        }
        @media (max-width: 480px) { .about-photo { height: 240px !important; } }
      `}</style>
    </section>
  );
}

function AboutStrip() {
  const { t } = useLang();
  return (
    <Reveal>
      <section aria-labelledby="about-titre" className="about-strip" style={{ display: "grid", gap: 2, background: "#111", padding: 2, margin: "2px 0" }}>
        <div className="about-photo" style={{ position: "relative", overflow: "hidden" }}>
          <Image src="/images/hero.jpg" fill style={{ objectFit: "cover" }} alt={t.about.ariaImg} sizes="50vw" />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.2)" }} />
          <span aria-hidden="true" style={{ position: "absolute", top: 20, left: 20, fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", border: "0.5px solid rgba(255,255,255,0.12)", padding: "5px 10px" }}>STUDIØ.JRMH</span>
        </div>

        <div style={{ background: "#080808", padding: "clamp(36px,5vw,56px) clamp(28px,5vw,48px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>

          <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {t.about.label}
          </p>

          <h2 id="about-titre" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5.5vw, 52px)", letterSpacing: "0.04em", color: "#fff", lineHeight: 0.9, margin: 0 }}>
            {t.about.title1}<br />
            <span aria-label={t.about.title2} style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.35)" }}>
              {t.about.title2}
            </span>
          </h2>

          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px, 1.6vw, 14px)", lineHeight: 1.85, color: "rgba(255,255,255,0.62)", fontStyle: "italic", maxWidth: 340, margin: 0 }}>
            {t.about.bio}
          </p>

          {/* Séparateur */}
          <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", maxWidth: 280 }} />

          <Link
            href="/about"
            aria-label={t.about.ariaCta}
            style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", transition: "color 0.15s", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          >
            <span style={{ display: "block", width: 16, height: "0.5px", background: "currentColor", flexShrink: 0 }} aria-hidden="true" />
            {t.about.cta}
          </Link>
        </div>
      </section>
    </Reveal>
  );
}

function ClientCTA() {
  const { t } = useLang();
  return (
    <Reveal>
      <section aria-labelledby="client-titre" style={{ padding: "clamp(52px,8vw,72px) clamp(20px,5vw,32px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderTop: "0.5px solid rgba(240,240,240,0.07)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 18 }}>{t.cta.label}</p>
        <h2 id="client-titre" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px,9vw,80px)", letterSpacing: "0.04em", color: "#fff", lineHeight: 0.9, marginBottom: 18 }}>
          {t.cta.title1}<br />
          <span aria-label={t.cta.title2} style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.35)" }}>{t.cta.title2}</span>
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px,1.8vw,14px)", lineHeight: 1.8, color: "rgba(255,255,255,0.72)", fontStyle: "italic", maxWidth: 300, marginBottom: 32 }}>{t.cta.body}</p>
        <Link href="/client" style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#080808", background: "#fff", padding: "14px 36px", textDecoration: "none", display: "inline-block", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#e8e8e8"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
          {t.cta.btn}
        </Link>
      </section>
    </Reveal>
  );
}

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Hero />
      <TagScroll />
      <WorkGrid />
      <AboutStrip />
      <ClientCTA />
    </div>
  );
}