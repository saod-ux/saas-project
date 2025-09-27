/**
 * Authentication Types and User Type Detection
 * 
 * This file defines the authentication architecture for the three-tier system:
 * - Customer: Regular storefront users
 * - Merchant Admin: Tenant administrators
 * - Platform Admin: Platform administrators
 */

export type UserType = 'customer' | 'merchant_admin' | 'platform_admin';

export type UserRole = 
  // Customer roles
  | 'customer'
  // Merchant admin roles
  | 'owner' | 'admin' | 'staff' | 'editor'
  // Platform admin roles
  | 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';

export interface AuthClaims {
  userType: UserType;
  role?: UserRole;
  tenantId?: string;
  tenantSlug?: string;
  permissions?: string[];
}

export interface UserContext {
  uid: string;
  email: string;
  userType: UserType;
  role?: UserRole;
  tenantId?: string;
  tenantSlug?: string;
  permissions?: string[];
}

/**
 * Validate that custom claims contain required user type information
 */
export function validateCustomClaims(claims: any): boolean {
  return claims && 
         typeof claims.userType === 'string' && 
         ['customer', 'merchant_admin', 'platform_admin'].includes(claims.userType);
}

/**
 * Get default role for user type
 */
export function getDefaultRole(userType: UserType): UserRole {
  switch (userType) {
    case 'customer':
      return 'customer';
    case 'merchant_admin':
      return 'admin';
    case 'platform_admin':
      return 'ADMIN';
  }
}

/**
 * Check if user type has access to a specific route
 */
export function hasRouteAccess(userType: UserType, pathname: string): boolean {
  // Platform admin routes
  if (pathname.startsWith('/admin/platform')) {
    return userType === 'platform_admin';
  }
  
  // Merchant admin routes
  if (pathname.startsWith('/admin/')) {
    return userType === 'merchant_admin' || userType === 'platform_admin';
  }
  
  // Customer routes (storefront)
  if (pathname.startsWith('/') && !pathname.startsWith('/admin')) {
    return userType === 'customer' || userType === 'merchant_admin' || userType === 'platform_admin';
  }
  
  return false;
}

/**
 * Get appropriate sign-in URL for user type
 */
export function getSignInUrl(userType: UserType, redirect?: string): string {
  const baseUrls = {
    customer: '/sign-in',
    merchant_admin: '/admin/sign-in',
    platform_admin: '/platform/sign-in'
  };
  
  const baseUrl = baseUrls[userType];
  return redirect ? `${baseUrl}?redirect=${encodeURIComponent(redirect)}` : baseUrl;
}

/**
 * Get appropriate redirect URL after sign-in
 */
export function getRedirectUrl(userType: UserType, tenantSlug?: string): string {
  switch (userType) {
    case 'customer':
      return tenantSlug ? `/${tenantSlug}/account` : '/demo-store/account';
    case 'merchant_admin':
      return tenantSlug ? `/admin/${tenantSlug}/overview` : '/admin/demo-store/overview';
    case 'platform_admin':
      return '/admin/platform';
  }
}

/**
 * Validate user permissions for specific actions
 */
export function hasPermission(userRole: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    // Customer permissions
    customer: ['view_products', 'add_to_cart', 'place_order', 'view_orders'],
    
    // Merchant admin permissions
    owner: ['*'], // Full access
    admin: ['manage_products', 'manage_orders', 'manage_customers', 'view_analytics', 'manage_settings'],
    staff: ['manage_products', 'manage_orders', 'view_analytics'],
    editor: ['manage_products', 'view_analytics'],
    
    // Platform admin permissions
    SUPER_ADMIN: ['*'], // Full platform access
    ADMIN: ['manage_tenants', 'view_platform_analytics', 'manage_platform_settings'],
    SUPPORT: ['view_tenants', 'view_platform_analytics']
  };
  
  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
}

/**
 * Create custom claims object for Firebase
 */
export function createCustomClaims(userType: UserType, role: UserRole, tenantId?: string, tenantSlug?: string): AuthClaims {
  return {
    userType,
    role,
    tenantId,
    tenantSlug,
    permissions: getPermissionsForRole(role)
  };
}

/**
 * Get permissions array for a role
 */
function getPermissionsForRole(role: UserRole): string[] {
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
