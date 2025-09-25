import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { getTenantDocuments, createDocument } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    console.log('🔍 Session creation request:', { 
      hasIdToken: !!idToken, 
      tokenLength: idToken?.length,
      tokenStart: idToken?.substring(0, 20) + '...',
      tokenEnd: '...' + idToken?.substring(idToken.length - 20)
    });
    
    if (!idToken) {
      return NextResponse.json({ ok: false, error: 'Missing idToken' }, { status: 400 });
    }

    // Verify Firebase ID token
    console.log('🔍 Verifying Firebase ID token...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('✅ Firebase ID token verified:', { uid: decodedToken.uid, email: decodedToken.email });
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!uid || !email) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check platform role
    let platformRole = null;
    try {
      const platformUsers = await getTenantDocuments('platformUsers', '');
      let platformUser = platformUsers.find((user: any) => user.uid === uid);
      
      if (!platformUser) {
        // Create platform user if doesn't exist
        console.log('Creating new platform user:', uid);
        platformUser = {
          uid,
          email,
          role: 'platformAdmin', // Give platform admin role for new users
          createdAt: new Date().toISOString(),
        };
        await createDocument('platformUsers', platformUser);
      }
      
      if (platformUser?.role) {
        platformRole = platformUser.role;
      }
    } catch (error) {
      console.log('Error handling platform user:', error);
    }

    // Check tenant roles (for now, we'll use a default tenant)
    let tenantRole = null;
    let tenantSlug = null;
    try {
      // For MVP, check if user has any tenant membership
      const allTenants = await getTenantDocuments('tenants', '');
      let foundTenant = false;
      
      for (const tenant of allTenants) {
        const tenantUsers = await getTenantDocuments('tenantUsers', tenant.id);
        let tenantUser = tenantUsers.find((user: any) => user.uid === uid);
        
        if (!tenantUser) {
          // Create tenant user if doesn't exist
          console.log('Creating new tenant user:', uid, 'for tenant:', tenant.id);
          tenantUser = {
            uid,
            email,
            role: 'admin', // Give admin role for new users
            createdAt: new Date().toISOString(),
          };
          await createDocument('tenantUsers', tenantUser);
        }
        
        if (tenantUser?.role) {
          tenantRole = tenantUser.role;
          tenantSlug = tenant.slug;
          foundTenant = true;
          break;
        }
      }
      
      // If no tenants exist, create a default one
      if (!foundTenant && allTenants.length === 0) {
        console.log('Creating default tenant for user:', uid);
        const defaultTenant = {
          name: 'Demo Store',
          slug: 'demo-store',
          createdAt: new Date().toISOString(),
        };
        await createDocument('tenants', defaultTenant);
        
        const tenantUser = {
          uid,
          email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        await createDocument('tenantUsers', tenantUser);
        
        tenantRole = 'admin';
        tenantSlug = 'demo-store';
      }
    } catch (error) {
      console.log('Error handling tenant user:', error);
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
