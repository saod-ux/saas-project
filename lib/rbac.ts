import { getUserFromRequest } from './firebase/auth-server';
import { getTenantBySlug } from './services/tenant';
import { getTenantDocuments, COLLECTIONS } from './firebase/tenant';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type PlatformRole = 'SUPER_ADMIN' | 'SUPPORT' | 'BILLING';

export async function requirePlatformRole(
  request: NextRequest,
  allowedRoles: PlatformRole[]
): Promise<{ user: any; role: PlatformRole } | NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Get platform admin record
    const platformAdmins = await getTenantDocuments(COLLECTIONS.PLATFORM_ADMINS, '');
    const platformAdmin = platformAdmins.find((admin: any) => admin.userId === user.uid);

    if (!platformAdmin) {
      return NextResponse.json({ ok: false, error: 'ACCESS_DENIED' }, { status: 403 });
    }

    if (!allowedRoles.includes(platformAdmin.role)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: platformAdmin.role
      }, { status: 403 });
    }

    return { user: { id: user.uid }, role: platformAdmin.role };
  } catch (error) {
    console.error('Error in requirePlatformRole:', error);
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }
}

export async function requireTenantAndRole(
  request: NextRequest,
  tenantSlug: string,
  requiredRole: string | string[]
): Promise<{ user: any; role: string; tenant?: any } | NextResponse> {
  try {
    // TEMPORARY: Skip authentication for development
    // TODO: Implement proper authentication later
    
    // Get tenant info
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
    }
    
    // Return mock user data for development
    return { 
      user: { id: 'dev-user-123' }, 
      role: 'OWNER', 
      tenant 
    };
  } catch (error) {
    console.error('Error in requireTenantAndRole:', error);
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }
}

// Placeholder function for logAction
export async function logAction(details: any) {
  console.log('Action logged:', details);
}
