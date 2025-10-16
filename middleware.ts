import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Middleware for route protection and API key validation
 *
 * IMPORTANT: Due to CVE-2025-29927, NEVER rely on middleware alone for authentication
 * Always use DAL functions (verifyAuth, requireAuth, etc.) in:
 * - Server Components
 * - Server Actions
 * - API Routes
 *
 * This middleware provides a first layer of defense but must be supplemented
 * with server-side checks.
 */

export default auth((req) => {
  const { pathname } = req.nextUrl

  // If accessing admin routes, verify authentication
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      // Redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If accessing API admin routes, verify authentication
  if (pathname.startsWith('/api/admin')) {
    if (!req.auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
})

/**
 * Matcher configuration
 * Specifies which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
