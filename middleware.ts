import { NextRequest, NextResponse } from 'next/server'

// Define which routes require authentication
const protectedRoutes = ['/posts/new', '/posts/edit', '/profile', '/settings']

// Define which routes should redirect authenticated users
const authRoutes = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Get auth token from cookies
  const authToken = req.cookies.get('auth.accessToken')?.value
  const isAuthenticated = !!authToken

  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', req.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Handle auth routes (redirect to homepage if already logged in)
  const isAuthRoute = authRoutes.some((route) => pathname === route)
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Continue for all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
