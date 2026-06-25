import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/client']
const AUTH_ROUTES      = ['/login', '/register', '/reset-password', '/forgot-password', '/set-password']

export const authConfig = {
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user
      const isProtected = PROTECTED_ROUTES.some((r) => nextUrl.pathname.startsWith(r))
      const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

      if (isProtected && !isLoggedIn) {
        const loginUrl = new URL('/login', nextUrl.origin)
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/client', nextUrl.origin))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
