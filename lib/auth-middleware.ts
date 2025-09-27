/**
 * Authentication Middleware
 * 
 * This file provides middleware functions for user type validation and route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerDb } from '@/lib/firebase/db';
import { UserType, UserRole, AuthClaims, hasRouteAccess, getSignInUrl } from '@/lib/auth-types';

export interface AuthContext {
  uid: string;
  email: string;
  userType: UserType;
  role?: UserRole;
  tenantId?: string;
  tenantSlug?: string;
  permissions?: string[];
}

/**
 * Extract user context from request cookies and Firebase token
 */
export function extractUserContext(request: NextRequest): AuthContext | null {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    const uidCookie = request.cookies.get('uid')?.value;
    
    if (!sessionCookie || !uidCookie) {
      return null;
    }

    // Get user type from cookies
    const userType = request.cookies.get('user_type')?.value as UserType;
    const role = request.cookies.get('role')?.value as UserRole;
    const tenantId = request.cookies.get('tenant_id')?.value;
    const tenantSlug = request.cookies.get('tenant_slug')?.value;
    const email = request.cookies.get('email')?.value;

    if (!userType || !email) {
      return null;
    }

    return {
      uid: uidCookie,
      email,
      userType,
      role,
      tenantId,
      tenantSlug,
      permissions: getPermissionsForRole(role)
    };
  } catch (error) {
    console.error('Error extracting user context:', error);
    return null;
  }
}

/**
 * Require specific user type for route access
 */
export function requireUserType(
  request: NextRequest,
  requiredUserType: UserType | UserType[],
  redirectTo?: string
): NextResponse | null {
  const userContext = extractUserContext(request);
  
  if (!userContext) {
    const userTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType];
    const signInUrl = getSignInUrl(userTypes[0], redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  const allowedTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType];
  if (!allowedTypes.includes(userContext.userType)) {
    const signInUrl = getSignInUrl(userContext.userType, redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  return null;
}

/**
 * Require specific role for route access
 */
export function requireRole(
  request: NextRequest,
  requiredRole: UserRole | UserRole[],
  redirectTo?: string
): NextResponse | null {
  const userContext = extractUserContext(request);
  
  if (!userContext || !userContext.role) {
    const signInUrl = getSignInUrl(userContext?.userType || 'customer', redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowedRoles.includes(userContext.role)) {
    const signInUrl = getSignInUrl(userContext.userType, redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  return null;
}

/**
 * Require tenant access (for merchant admin routes)
 */
export function requireTenantAccess(
  request: NextRequest,
  tenantSlug: string,
  redirectTo?: string
): NextResponse | null {
  const userContext = extractUserContext(request);
  
  if (!userContext) {
    const signInUrl = getSignInUrl('merchant_admin', redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  // Platform admins have access to all tenants
  if (userContext.userType === 'platform_admin') {
    return null;
  }

  // Merchant admins must have access to the specific tenant
  if (userContext.userType === 'merchant_admin') {
    if (userContext.tenantSlug !== tenantSlug) {
      const signInUrl = getSignInUrl('merchant_admin', redirectTo || request.nextUrl.pathname);
      return NextResponse.redirect(new URL(signInUrl, request.url));
    }
  }

  return null;
}

/**
 * Require specific permission for route access
 */
export function requirePermission(
  request: NextRequest,
  permission: string,
  redirectTo?: string
): NextResponse | null {
  const userContext = extractUserContext(request);
  
  if (!userContext) {
    const signInUrl = getSignInUrl('customer', redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  if (!userContext.permissions?.includes('*') && !userContext.permissions?.includes(permission)) {
    const signInUrl = getSignInUrl(userContext.userType, redirectTo || request.nextUrl.pathname);
    return NextResponse.redirect(new URL(signInUrl, request.url));
  }

  return null;
}

/**
 * Check if user has access to a specific route
 */
export function hasAccess(request: NextRequest, pathname: string): boolean {
  const userContext = extractUserContext(request);
  
  if (!userContext) {
    return false;
  }

  return hasRouteAccess(userContext.userType, pathname);
}

/**
 * Get permissions array for a role
 */
function getPermissionsForRole(role?: UserRole): string[] {
  if (!role) return [];
  
  const permissions: Record<UserRole, string[]> = {
    customer: ['view_products', 'add_to_cart', 'place_order', 'view_orders'],
    owner: ['*'],
    admin: ['manage_products', 'manage_orders', 'manage_customers', 'view_analytics', 'manage_settings'],
    staff: ['manage_products', 'manage_orders', 'view_analytics'],
    editor: ['manage_products', 'view_analytics'],
    SUPER_ADMIN: ['*'],
    ADMIN: ['manage_tenants', 'view_platform_analytics', 'manage_platform_settings'],
    SUPPORT: ['view_tenants', 'view_platform_analytics']
  };
  
  return permissions[role] || [];
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>,
  options?: {
    userType?: UserType | UserType[];
    role?: UserRole | UserRole[];
    permission?: string;
    tenantRequired?: boolean;
  }
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Extract user context
      const userContext = await extractUserContext(request);
      
      if (!userContext) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check user type
      if (options?.userType) {
        const allowedTypes = Array.isArray(options.userType) ? options.userType : [options.userType];
        if (!allowedTypes.includes(userContext.userType)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Check role
      if (options?.role && userContext.role) {
        const allowedRoles = Array.isArray(options.role) ? options.role : [options.role];
        if (!allowedRoles.includes(userContext.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Check permission
      if (options?.permission) {
        if (!userContext.permissions?.includes('*') && !userContext.permissions?.includes(options.permission)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Check tenant access for merchant admin routes
      if (options?.tenantRequired && userContext.userType === 'merchant_admin') {
        if (!userContext.tenantId || !userContext.tenantSlug) {
          return NextResponse.json(
            { error: 'Tenant access required' },
            { status: 403 }
          );
        }
      }

      // Call the original handler with user context
      return await handler(request, userContext, ...args);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
