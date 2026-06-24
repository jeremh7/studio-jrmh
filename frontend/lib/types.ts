// ─────────────────────────────────────────────────────────────
// Types partagés — Studiø JRMH V2
// ─────────────────────────────────────────────────────────────

export interface ClientUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  credits: number
  accountStatus: 'active' | 'suspended' | 'pending_verification'
  isVerified: boolean
  emailVerifiedAt: string | null
  createdAt: string
  lastLoginAt: string | null
}

export interface AuthResponse {
  token: string
  client: ClientUser
}

// ── Galerie ───────────────────────────────────────────────────

export type GalleryStatus  = 'draft' | 'active' | 'expired' | 'archived'
export type DeliveryMode   = 'web_only' | 'full_hd' | 'mixed'
export type WatermarkLevel = 'none' | 'subtle' | 'strong'

export interface Gallery {
  id: number
  title: string
  description?: string | null
  status: GalleryStatus
  photoCount: number
  accessCode: string
  deliveryMode: DeliveryMode
  watermarkLevel?: WatermarkLevel
  downloadEnabled?: boolean
  expiresAt: string | null
  publishedAt: string | null
  sessionDate: string | null
  isExpired: boolean
  isAccessible: boolean
}

// ── Photo ─────────────────────────────────────────────────────

export interface Photo {
  id: number
  url: string
  hasFullVersion: boolean
  caption: string | null
  width: number | null
  height: number | null
  filename: string
  fileSize: string
  webSize: number | null
  featured: boolean
  isPurchasable: boolean
  unitPrice: string | null
}

export interface GalleryWithPhotos {
  gallery: Gallery & {
    accessCode: string
    shareToken: string | null
    watermarkLevel: WatermarkLevel
    downloadEnabled: boolean
    description?: string | null
    sessionDate: string | null
    expiresAt: string | null
    photoCount: number
  }
  photos: Photo[]
  total: number
}

export interface PublicGallery {
  id: number
  title: string
  description?: string | null
  code: string
  photoCount: number
  downloadEnabled: boolean
  deliveryMode: DeliveryMode
  expiresAt: string | null
  sessionDate: string | null
  client: { name: string }
}

// ── Erreurs ───────────────────────────────────────────────────

export interface ApiError {
  error?: string
  errors?: Record<string, string>
}

// ── NextAuth augmentation ─────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    accessToken: string
    client: ClientUser
    error?: string
  }
  interface User {
    accessToken: string
    client: ClientUser
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken: string
    client: ClientUser
    expiresAt?: number
    error?: string
  }
}
