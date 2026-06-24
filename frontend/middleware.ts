// ─────────────────────────────────────────────────────────────
// Middleware — Protection des routes
// ─────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/client']
const AUTH_ROUTES      = ['/login', '/register', '/reset-password', '/forgot-password', '/set-password']

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

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

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
