// ─────────────────────────────────────────────────────────────
// NextAuth v5 — Configuration
// ─────────────────────────────────────────────────────────────

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { apiLogin } from '@/lib/api'
import { authConfig } from '@/auth.config'

// Schéma de validation des credentials
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',       type: 'email'    },
        password: { label: 'Mot de passe', type: 'password' },
      },

      async authorize(credentials) {
        // Validation Zod
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const { token, client } = await apiLogin(
            parsed.data.email,
            parsed.data.password
          )

          // Retourne l'objet User que NextAuth va stocker dans le JWT
          return {
            id:          String(client.id),
            email:       client.email,
            name:        client.fullName,
            accessToken: token,
            client,
          }
        } catch {
          // Identifiants invalides → retourne null (NextAuth gère l'erreur)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.client      = user.client
        // Stocke l'expiration du JWT Symfony (TTL = 3600s)
        token.expiresAt   = Math.floor(Date.now() / 1000) + 3600
      }
      // JWT Symfony expiré → force la déconnexion au prochain refresh de session
      if (token.expiresAt && Date.now() / 1000 > (token.expiresAt as number)) {
        return { ...token, error: 'TokenExpired' }
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.client      = token.client
      session.error       = token.error as string | undefined
      return session
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   3600, // 1 heure — correspond au JWT_TTL Symfony
  },
})