# Studiø.JRMH — Backend Symfony 7.2

## Stack
- **Symfony 7.2** (PHP 8.2+)
- **Doctrine ORM** (MySQL 8 ou PostgreSQL 16)
- **Twig** — admin panel
- **Nelmio CORS** — API pour le front Next.js
- **Symfony Mailer** — emails clients

## Installation

```bash
# 1. Cloner et installer
composer install

# 2. Configurer l'environnement
cp .env .env.local
# → Éditer DATABASE_URL, MAILER_DSN, etc.

# 3. Base de données
php bin/console doctrine:database:create
php bin/console doctrine:migrations:diff
php bin/console doctrine:migrations:migrate

# 4. Créer le dossier uploads
mkdir -p var/uploads

# 5. Créer l'admin
php bin/console app:create-admin admin@studiojrmh.fr MotDePasse123! "Jérémy Hordé"

# 6. Lancer
symfony server:start
# ou
php -S localhost:8000 -t public/
```

→ Admin : http://localhost:8000/admin/login

---

## Structure

```
src/
├── Entity/
│   ├── User.php        # Admin
│   ├── Client.php      # Clients photographe
│   ├── Gallery.php     # Galerie privée (code d'accès)
│   └── Photo.php       # Photos dans galerie
├── Controller/
│   ├── SecurityController.php    # Login/logout
│   ├── Admin/
│   │   ├── DashboardController.php
│   │   ├── GalleryController.php  # CRUD + upload + publish
│   │   └── ClientController.php
│   └── Api/
│       └── GalleryController.php  # API JSON pour Next.js
├── Service/
│   └── GalleryService.php  # Upload, codes, emails, stats
└── Command/
    └── CreateAdminCommand.php
```

---

## Workflow type

1. **Créer un client** — `/admin/clients/new`
2. **Créer une galerie** — `/admin/galleries/new` (code généré auto: `JRMH47`)
3. **Uploader les photos** — drag & drop dans la galerie
4. **Publier** — clic sur "Publier" → choisir durée → email envoyé au client
5. **Client reçoit** l'email avec son code et l'URL du front-end

---

## API pour Next.js

```
POST /api/gallery/access
Body: { "code": "JRMH47" }
→ Retourne infos galerie si code valide

GET /api/gallery/{CODE}/photos
→ Retourne la liste des photos
```

---

## Variables d'environnement clés

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connexion MySQL/PostgreSQL |
| `MAILER_DSN` | SMTP (Mailtrap dev, SMTP prod) |
| `MAILER_FROM` | Email expéditeur |
| `UPLOAD_DIR` | Dossier d'upload (défaut: `var/uploads`) |
| `FRONTEND_URL` | URL du front Next.js (CORS) |
