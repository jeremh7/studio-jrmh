import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/client')) {
    return NextResponse.next()
  }

  const hasSession = SESSION_COOKIES.some(name => request.cookies.has(name))

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/client/:path*'],
}
