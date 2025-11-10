
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Restrict direct access to the signup page.
  if (pathname === '/signup') {
    const cookie = request.cookies.get('signup_access')?.value
    const referer = request.headers.get('referer') || ''
    const allowedReferrer = referer.includes('/login') || referer.includes('/admin/login')

    // Block if no short-lived access cookie and not coming from allowed pages
    if (!cookie && !allowedReferrer) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'signup-blocked')
      return NextResponse.redirect(url)
    }
  }

  // Default behavior
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/signup'],
}
