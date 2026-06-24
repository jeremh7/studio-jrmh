// ─────────────────────────────────────────────────────────────
// components/auth/SignOutButton.tsx
// ─────────────────────────────────────────────────────────────

'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-xs tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors"
    >
      Déconnexion
    </button>
  )
}