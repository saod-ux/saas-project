import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that should never be protected
  const publicRoutes = [
    '/sign-in',
    '/sign-up', 
    '/debug-env',
    '/create-user',
    '/login',
    '/checkout',
    '/no-tenant',
    '/onboarding'
  ];
  
  // Skip middleware for static files, API routes, and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Check for session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    const uidCookie = request.cookies.get('uid')?.value;

    if (!sessionCookie || !uidCookie) {
      // Redirect to sign-in with return URL
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Enforce roles using session cookies
    const platformRole = request.cookies.get('platform_role')?.value || '';
    const tenantRole = request.cookies.get('tenant_role')?.value || '';

    // Platform admin area requires platform role
    if (pathname.startsWith('/admin/platform')) {
      const isPlatformAdmin = platformRole === 'ADMIN' || platformRole === 'SUPER_ADMIN';
      if (!isPlatformAdmin) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
    } else {
      // Tenant admin area requires admin/owner role
      const isAdmin = tenantRole === 'admin' || tenantRole === 'owner';
      if (!isAdmin) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Allow all other routes (storefront, public pages)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico|apple-touch-icon).*)',
  ],
};