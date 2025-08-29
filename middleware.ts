import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'
import { extractTenantSlug } from './lib/tenant'

export default authMiddleware({
  beforeAuth: (req) => {
    const host = req.headers.get('host') || ''
    const tenantSlug = extractTenantSlug(host)
    
    // Clone the request headers
    const requestHeaders = new Headers(req.headers)
    
    // Set the tenant slug header for API routes
    if (tenantSlug) {
      requestHeaders.set('x-tenant-slug', tenantSlug)
    }
    
    // For admin routes, ensure we have a tenant
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!tenantSlug) {
        // Redirect to a default tenant or show error
        return NextResponse.redirect(new URL('/no-tenant', req.url))
      }
    }
    
    // Continue with the modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  },
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/no-tenant',
    '/test-upload'
  ],
  ignoredRoutes: [
    '/_next/static',
    '/_next/image',
    '/favicon.ico'
  ],
  // Let API routes handle their own authentication
  afterAuth: (auth, req) => {
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
