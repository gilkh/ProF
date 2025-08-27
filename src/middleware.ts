
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for the 'role' cookie
  const role = request.cookies.get('role')?.value

  // If the user is trying to access an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // And they are not an admin, redirect them to the login page
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
}
