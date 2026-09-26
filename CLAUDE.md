# Studiø JRMH — Guide de travail

Site vitrine + espace client de **Jérémy Hordé**, photographe (sport, portrait, événementiel) à Troyes. En ligne sur **studiojrmh.fr**. Bilingue FR/EN. Tous les échanges avec Jérémy se font en français.

## Stack & architecture

| Couche | Techno | Hébergement |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Framer Motion (`motion/react`), GSAP (nav), NextAuth v5 | **Vercel** |
| Backend | Symfony 7.2, PHP 8.2+, Doctrine, PostgreSQL | **Railway** (service `backend`, projet `studio-jrmh`) |
| Photos | Cloudflare **R2** — bucket public (WebP web) + bucket privé (originaux HD) | Cloudflare |
| Emails | Symfony Mailer → **Brevo API** (`brevo+api://`, pas SMTP) | Brevo |
| DNS | Domaine chez **OVH** (pas Cloudflare) | OVH |

- `studiojrmh.fr/admin` = **rewrite** Next.js (`frontend/next.config.js`) vers le backend — pas une redirection.
- Backend joignable sur `backend.studiojrmh.fr` (domaine custom) et `backend-production-ac8c.up.railway.app`.
- Le front appelle l'API en direct via `NEXT_PUBLIC_API_URL` (pas de proxy `/api`).

## Commandes utiles

```bash
# Déployer le frontend (on déploie via le CLI Vercel après chaque push)
cd frontend && vercel --prod --yes

# Déployer le backend : un push sur main déclenche l'auto-deploy Railway
git push origin main

# Logs backend
railway logs --service backend

# SQL en prod : via SSH + heredoc (railway run ne résout pas postgres.railway.internal)
railway ssh --service backend << 'EOF'
php bin/console dbal:run-sql "SELECT ..."
exit
EOF

# Typecheck front
cd frontend && npx tsc --noEmit
```

Preview local branché sur les vraies données : config `frontend-dev-prodapi` dans `.claude/launch.json` (le CORS du backend autorise `localhost:3000`).

## Façon de coder

- **Styles inline React** pour quasiment tout (contrôle fin de la DA éditoriale) ; un bloc `<style>` dans le composant pour hover, media queries et keyframes. Tailwind n'est presque pas utilisé.
- Composants client avec `'use client'` ; animations d'apparition via `motion/react` (`initial` / `animate` / `whileInView`).
- Textes toujours via l'i18n (`useLang()` → `t.xxx`, `frontend/lib/i18n.ts`, clés FR **et** EN).
- **Pas de commentaires** sauf pour expliquer un *pourquoi* non évident (contrainte cachée, contournement).
- Changements **minimaux et ciblés** : pas de refacto ou de fonctionnalité non demandée. Un composant partagé seulement quand plusieurs endroits en ont besoin (ex. `components/LightboxSpinner.tsx` pour les 3 visionneuses).
- Gardes défensives là où le DOM peut ne pas exister (ex. refs GSAP dans `Nav.tsx`).
- Backend : erreurs d'envoi d'email non bloquantes, mais toujours loguées — **sans** données sensibles.

## Méthode de travail (ce qui a bien marché)

1. **Diagnostiquer avant de corriger** : lire le code réel, vérifier la vérité terrain (curl, logs, requête SQL, inspection du DOM) plutôt que supposer.
2. **Méfiance envers les faux positifs** : l'onglet de test en arrière-plan ralentit les animations et fausse certaines mesures. Recouper avant de conclure à un bug (ex. télécharger l'image et la vérifier avec PIL plutôt que se fier à `naturalWidth`).
3. **Tester visuellement** tout changement d'interface (preview local puis site en prod, y compris en vue mobile 375px) avant de dire que c'est fini.
4. **Ne commiter que sur demande explicite** (« commite et push »). Un commit par sujet, messages en français au format `feat:` / `fix:` / `perf:`, corps qui explique le *pourquoi*.
5. Après déploiement, **vérifier en ligne** que le changement est bien actif.
6. Réponses courtes et claires, sans jargon inutile ; donner le résultat et la prochaine étape.
7. Ce que Claude ne peut pas faire à la place de Jérémy (dashboards Brevo/OVH/Google, création de comptes externes), l'expliquer étape par étape.

## Direction artistique

- Fond `#080808`, blanc `#FFFFFF`, clair `#F0F0F0`, **unique accent or `#D4A843`** (`rgba(212,168,67,…)`), utilisé avec parcimonie.
- Typo : **Bebas Neue** (titres), **Space Mono** (labels en capitales très espacées), **DM Sans** (texte courant).
- Univers sombre, éditorial, minimaliste ; bordures 0.5px ; grain léger ; aucune ombre lourde.
- Curseur custom (`components/Cursor.tsx`) : `cursor: none !important` global, ne jamais remettre de `cursor: pointer`.
- Contraste WCAG AA respecté partout : ne pas descendre sous ~0.5 d'opacité pour du texte blanc sur fond noir.
- Nom de marque : « Studiø JRMH » (casse normale sur les supports officiels ; majuscules seulement comme choix graphique dans la nav).
- Portfolio : grille 2 colonnes sur mobile, masonry 5 colonnes sur les pages projet.

## Sécurité — règles non négociables

- **Ne jamais lire, afficher ni chercher `ADMIN_PASSWORD`**, sauf demande explicite de Jérémy. Il gère son mot de passe admin lui-même.
- Ne jamais afficher de secret en clair (clés API, DSN) : caviarder avant d'afficher une variable d'environnement.
- Ne pas loguer `$e->getDebug()` sur les erreurs de transport HTTP : la trace contient la clé API Brevo.
- Headers de sécurité (CSP stricte…) **uniquement en production**, sinon le Fast Refresh de `next dev` casse.
- Formulaire de contact : honeypot (`website`) + rate limiting — à conserver.

## Pièges connus

- `railway service restart` **ne recharge pas** les variables d'env ; il faut un redeploy. Modifier une variable avec `railway variables --set` déclenche déjà un nouveau déploiement.
- Le mot de passe admin est synchronisé depuis `ADMIN_PASSWORD` à chaque démarrage du backend.
- `CreateAdminCommand.php` a l'email admin codé en dur (`studiojrmh@gmail.com`) et ignore `ADMIN_EMAIL`.
- Deux emails différents : **public** `studio.jrmh@gmail.com` (contact, mentions légales) vs **login admin** `studiojrmh@gmail.com`.
- Monolog est en `fingers_crossed` (niveau `error`) : une requête réussie ne logue **rien**, pas même « email envoyé ». Absence de log = pas d'erreur.
- Brevo : la restriction d'IP pour les clés API doit rester **désactivée** (l'IP sortante de Railway change).
- Supprimer une galerie ou un projet : les fichiers R2/disque sont nettoyés dans les contrôleurs admin, pas par la cascade Doctrine.
- `public/uploads` est un symlink qui casse `railway up` (déploiement manuel, rare).
- Le preview Claude lit `.claude/launch.json` à la **racine** du repo, pas celui de `frontend/`.

## Compte de test

Client de test en prod : `studio.jrmh+test@gmail.com`. Ses emails arrivent dans la boîte `studio.jrmh@gmail.com`. Mot de passe transmis à Jérémy, non stocké ici.

## Historique des chantiers (résumé)

Refonte du portfolio et de l'admin · migration des photos vers Cloudflare R2 · reconstruction de l'infra Railway + Vercel · nettoyage des fichiers orphelins · proxy `/admin` · audit en 20 points (RGPD, CGU, cookies, SEO, sitemap, 404, anti-spam, analytics…) · contraste WCAG AA · headers de sécurité · Vercel Analytics · nav « STUDIØ JRMH » · curseur custom corrigé · favicon picto appareil photo · fiche Google Business Profile · QR code pour la carte de visite · domaine `backend.studiojrmh.fr` · audit de performance · warnings GSAP corrigés · emails réparés (restriction IP Brevo) + fuite de clé API dans les logs corrigée + clé régénérée · portfolio en 2 colonnes sur mobile · indicateur de chargement dans les visionneuses photo.
