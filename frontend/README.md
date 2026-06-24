# Studiø.JRMH — Site photo pro

Stack : **Next.js 15** · **React 19** · **Motion (Framer)** · **Lenis** · **Tailwind CSS** · **TypeScript**

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## Structure

```
studiojrmh/
├── app/
│   ├── layout.tsx          # Root layout (Lenis, cursor, grain, Nav)
│   ├── globals.css         # Styles globaux + grain + curseur
│   ├── page.tsx            # Home — hero collage + preview strip
│   ├── work/page.tsx       # Galerie publique — mosaic + filtres
│   ├── client/page.tsx     # Espace client — gate par code
│   └── about/page.tsx      # About
├── components/
│   ├── Cursor.tsx          # Curseur custom animé (Motion)
│   └── Nav.tsx             # Navigation flottante
```

---

## Ajouter tes vraies photos

### Pages Work & Home
Remplace les divs placeholder par des composants Next.js `<Image>` :

```tsx
// Avant
<div className="w-full h-full bg-[#141210]" />

// Après
import Image from 'next/image'
<Image
  src="/photos/sport-01.jpg"
  fill
  className="object-cover"
  alt="Finale régionale"
/>
```

Place tes photos dans `public/photos/`.

### Photo collage (Home)
Dans `app/page.tsx`, la div `.torn-photo` → remplace par :
```tsx
<Image
  src="/photos/hero-collage.jpg"
  fill
  className="object-cover torn"
  alt="Jeremy Hordé"
/>
```

---

## Galeries client (production)

Actuellement les codes sont hardcodés dans `app/client/page.tsx`.
Pour un vrai système :

1. Crée une **API Route** `app/api/gallery/route.ts`
2. Stocke les codes + photos dans une DB (Supabase, PlanetScale, etc.)
3. Génère un code unique par client après chaque session
4. Envoie le code par email (Resend, Nodemailer)
5. Les photos sont servies depuis un bucket privé (Cloudflare R2, S3)

---

## Effets & libs utilisés

| Effet | Lib |
|---|---|
| Curseur magnétique custom | `motion` (useSpring) |
| Smooth scroll | `lenis` |
| Animations scroll/reveal | `motion` (useInView, useScroll) |
| Page transitions | `motion` (AnimatePresence) |
| Grain de texture | SVG inline (CSS `background-image`) |
| Typo massive stroke | CSS `-webkit-text-stroke` |
| Collage photo déchiré | CSS `clip-path` polygon |

---

## Déploiement

```bash
npm run build
```

Déploie sur **Vercel** (recommandé, zero-config avec Next.js) :
```bash
npx vercel
```
