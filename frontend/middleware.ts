import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/client']
const AUTH_ROUTES      = ['/login', '/register', '/reset-password', '/forgot-password', '/set-password']

export function middleware(request: NextRequest) {
  const { nextUrl } = request

  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ??
    request.cookies.get('__Secure-authjs.session-token')?.value

  const isLoggedIn  = !!sessionToken
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
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
