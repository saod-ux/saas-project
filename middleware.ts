import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders, developmentSecurityHeaders, securityHeadersConfig } from '@/lib/security/headers';
import { extractUserContext, requireUserType, requireRole, requireTenantAccess } from '@/lib/auth-middleware';
import { UserType, UserRole, getSignInUrl } from '@/lib/auth-types';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that should never be protected
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up', 
    '/debug-env',
    '/create-user',
    '/login',
    '/checkout',
    '/no-tenant',
    '/onboarding',
    '/admin/sign-in',
    '/platform/sign-in'
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
    const response = NextResponse.next();
    // Apply security headers to all responses
    const isDevelopment = process.env.NODE_ENV === 'development';
    return addSecurityHeaders(response, isDevelopment ? developmentSecurityHeaders : securityHeadersConfig);
  }

  // Platform admin routes - require platform admin user type
  if (pathname.startsWith('/admin/platform')) {
    const userContext = extractUserContext(request);
    if (!userContext || userContext.userType !== 'platform_admin') {
      const signInUrl = getSignInUrl('platform_admin', pathname);
      const response = NextResponse.redirect(new URL(signInUrl, request.url));
      return addSecurityHeaders(response, process.env.NODE_ENV === 'development' ? developmentSecurityHeaders : securityHeadersConfig);
    }
  }
  
  // Merchant admin routes - require merchant admin user type
  else if (pathname.startsWith('/admin/')) {
    const userContext = extractUserContext(request);
    if (!userContext || (userContext.userType !== 'merchant_admin' && userContext.userType !== 'platform_admin')) {
      const signInUrl = getSignInUrl('merchant_admin', pathname);
      const response = NextResponse.redirect(new URL(signInUrl, request.url));
      return addSecurityHeaders(response, process.env.NODE_ENV === 'development' ? developmentSecurityHeaders : securityHeadersConfig);
    }
    
    // Extract tenant slug from pathname for tenant-specific routes
    const pathParts = pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'admin') {
      const tenantSlug = pathParts[2];
      
      // Platform admins have access to all tenants
      if (userContext.userType === 'platform_admin') {
        // Allow access
      } else if (userContext.userType === 'merchant_admin') {
        // Check if merchant admin has access to this tenant
        if (userContext.tenantSlug !== tenantSlug) {
          // Redirect to their assigned tenant's overview
          const redirectUrl = userContext.tenantSlug ? `/admin/${userContext.tenantSlug}/overview` : '/admin/sign-in';
          const response = NextResponse.redirect(new URL(redirectUrl, request.url));
          return addSecurityHeaders(response, process.env.NODE_ENV === 'development' ? developmentSecurityHeaders : securityHeadersConfig);
        }
      }
    }
  }
  
  // Customer storefront routes - allow all authenticated users
  else if (pathname.startsWith('/') && !pathname.startsWith('/admin') && !pathname.startsWith('/platform')) {
    // For now, allow all storefront routes without authentication
    // In the future, we might want to protect certain customer routes
    const response = NextResponse.next();
    const isDevelopment = process.env.NODE_ENV === 'development';
    return addSecurityHeaders(response, isDevelopment ? developmentSecurityHeaders : securityHeadersConfig);
  }

  // Allow all other routes (storefront, public pages)
  const response = NextResponse.next();
  // Apply security headers to all responses
  const isDevelopment = process.env.NODE_ENV === 'development';
  return addSecurityHeaders(response, isDevelopment ? developmentSecurityHeaders : securityHeadersConfig);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico|apple-touch-icon).*)',
  ],
};