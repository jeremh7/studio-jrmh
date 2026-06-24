// ─────────────────────────────────────────────────────────────
// Client API — Symfony Backend
// ─────────────────────────────────────────────────────────────

import type { AuthResponse, ClientUser, Gallery, GalleryWithPhotos, Photo, PublicGallery } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Helpers ───────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const data = await res.json()

  if (!res.ok) {
    // 401 = token expiré ou invalide → signOut côté client si possible
    if (res.status === 401 && typeof window !== 'undefined') {
      const { signOut } = await import('next-auth/react')
      signOut({ callbackUrl: '/login' })
      throw new Error('Session expirée. Reconnexion…')
    }
    const message =
      data?.error ??
      Object.values(data?.errors ?? {}).join(', ') ??
      'Erreur serveur'
    throw new Error(message)
  }

  return data as T
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** Construit l'URL publique d'une photo à partir du chemin relatif retourné par l'API */
export function photoUrl(relPath: string): string {
  return `${API_URL}/uploads/${relPath.replace(/^\/uploads\//, '')}`
}

// ── Auth ──────────────────────────────────────────────────────

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function apiRegister(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiContact(data: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<void> {
  await apiFetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiForgotPassword(email: string): Promise<void> {
  await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function apiResetPassword(
  token: string,
  password: string
): Promise<void> {
  await apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function apiSetPassword(
  token: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function apiGetMe(token: string): Promise<ClientUser> {
  const data = await apiFetch<{ client: ClientUser }>('/api/auth/me', {
    headers: authHeaders(token),
  })
  return data.client
}

export async function apiVerifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export async function apiResendVerification(email: string): Promise<void> {
  await apiFetch('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// ── Galeries ──────────────────────────────────────────────────

export async function apiGetGalleries(token: string): Promise<{ galleries: Gallery[]; total: number }> {
  return apiFetch('/api/client/galleries', {
    headers: authHeaders(token),
    cache: 'no-store',
  })
}

export async function apiGetGalleryPhotos(
  galleryId: number,
  token: string
): Promise<GalleryWithPhotos> {
  return apiFetch(`/api/client/gallery/${galleryId}/photos`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
}

export async function apiDownloadGallery(
  galleryId: number,
  token: string,
  galleryTitle: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/client/gallery/${galleryId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error ?? 'Erreur lors du téléchargement.')
  }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `studiojrmh-${galleryTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Partage par token sécurisé ────────────────────────────────

export async function apiGenerateShareToken(
  galleryId: number,
  token: string
): Promise<{ shareToken: string }> {
  return apiFetch(`/api/client/gallery/${galleryId}/share`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export async function apiRevokeShareToken(
  galleryId: number,
  token: string
): Promise<void> {
  await apiFetch(`/api/client/gallery/${galleryId}/share/revoke`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export async function apiPublicShareView(
  shareToken: string
): Promise<{ gallery: PublicGallery; photos: Photo[]; total: number }> {
  const res = await fetch(`${API_URL}/api/gallery/share/${encodeURIComponent(shareToken)}`, {
    cache: 'no-store',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Lien invalide ou révoqué.')
  return data
}

// ── Work / Projets publics (V1 compat) ────────────────────────

export interface Project {
  id: number
  slug: string
  title: string
  description?: string | null
  category: string
  categoryLabel: string
  coverImage?: string | null
  photoCount: number
  featured?: boolean
  eventDate?: string | null
  location?: string | null
  publishedAt?: string | null
  photos?: ProjectPhoto[]
}

export interface ProjectPhoto {
  id: number
  url: string
  caption?: string | null
  width?: number | null
  height?: number | null
  sortOrder: number
}

export const CATEGORIES = ['all', 'sport', 'portrait', 'studio', 'street', 'evenementiel', 'editorial'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  all:          'Tous',
  sport:        'Sport',
  portrait:     'Portrait',
  studio:       'Studio',
  street:       'Street',
  evenementiel: 'Événementiel',
  editorial:    'Éditorial',
}

export async function getProjects(category?: string): Promise<Project[]> {
  const url = category && category !== 'all'
    ? `/api/work?category=${encodeURIComponent(category)}`
    : '/api/work'
  const res = await fetch(`${API_URL}${url}`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.projects ?? data.works ?? [])
}

export async function getProject(slug: string): Promise<Project> {
  const res = await fetch(`${API_URL}/api/work/${slug}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Projet introuvable')
  const data = await res.json()
  // Support both { project, photos } and flat object shapes
  if (data.project) {
    return { ...data.project, photos: data.photos ?? [] }
  }
  return data
}
