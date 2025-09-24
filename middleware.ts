import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Check for authentication token in cookies or headers (defensive - no auto-auth)
    const authToken = request.cookies.get('admin_token')?.value ||
                      request.cookies.get('id_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      // Redirect to sign-in with return URL
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Enforce roles using cookies set after client auth (edge-safe; no Admin SDK here)
    const adminRole = request.cookies.get('admin_role')?.value || '';
    const platformRole = request.cookies.get('platform_role')?.value || '';

    // Platform admin area requires platform role
    if (pathname.startsWith('/admin/platform')) {
      const isPlatformAdmin = platformRole === 'ADMIN' || platformRole === 'SUPER_ADMIN';
      if (!isPlatformAdmin) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
    } else {
      // Tenant admin area requires admin role
      const isAdmin = adminRole === 'ADMIN' || adminRole === 'OWNER' || adminRole === 'SUPER_ADMIN';
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