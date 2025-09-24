import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/auth-server';
import { getTenantDocuments } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ ok: false, error: 'Missing idToken' }, { status: 400 });
    }

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!uid || !email) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check platform role
    let platformRole = null;
    try {
      const platformUsers = await getTenantDocuments('platformUsers', '');
      const platformUser = platformUsers.find((user: any) => user.uid === uid);
      if (platformUser?.role) {
        platformRole = platformUser.role;
      }
    } catch (error) {
      console.log('No platform role found for user:', uid);
    }

    // Check tenant roles (for now, we'll use a default tenant)
    let tenantRole = null;
    let tenantSlug = null;
    try {
      // For MVP, check if user has any tenant membership
      const allTenants = await getTenantDocuments('tenants', '');
      for (const tenant of allTenants) {
        const tenantUsers = await getTenantDocuments('tenantUsers', tenant.id);
        const tenantUser = tenantUsers.find((user: any) => user.uid === uid);
        if (tenantUser?.role) {
          tenantRole = tenantUser.role;
          tenantSlug = tenant.slug;
          break;
        }
      }
    } catch (error) {
      console.log('No tenant role found for user:', uid);
    }

    // Set secure HttpOnly cookies
    const response = NextResponse.json({ 
      ok: true, 
      uid, 
      email, 
      roles: { platformRole, tenantRole, tenantSlug }
    });

    // Set session cookie
    response.cookies.set('session', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set user ID cookie
    response.cookies.set('uid', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set role cookies
    if (platformRole) {
      response.cookies.set('platform_role', platformRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    if (tenantRole) {
      response.cookies.set('tenant_role', tenantRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    if (tenantSlug) {
      response.cookies.set('tenant_slug', tenantSlug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ ok: false, error: 'Authentication failed' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true });
    
    // Clear all auth cookies
    const cookiesToClear = ['session', 'uid', 'platform_role', 'tenant_role', 'tenant_slug'];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      });
    });

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ ok: false, error: 'Logout failed' }, { status: 500 });
  }
}
