import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { validateCustomClaims, getDefaultRole, createCustomClaims, UserType, UserRole } from '@/lib/auth-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json().catch(() => ({} as any));

    console.log("[SERVER] Session request", {
      hasIdToken: Boolean(idToken),
      tokenLength: idToken?.length ?? 0,
    });

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { ok: false, error: "NO_TOKEN" },
        { status: 400 }
      );
    }

    console.log("[SERVER] Verifying ID token…");
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    console.log("[SERVER] Token verified", {
      uid: decoded.uid,
      email: decoded.email,
    });
    
    const uid = decoded.uid;
    const email = decoded.email;

    if (!uid || !email) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get custom claims from the token
    const customClaims = decoded.customClaims || {};
    console.log('[SERVER] Custom claims:', customClaims);

    // Validate that custom claims contain required user type information
    if (!validateCustomClaims(customClaims)) {
      console.log('[SERVER] Invalid or missing custom claims, denying access');
      return NextResponse.json({ 
        ok: false, 
        error: 'INVALID_CLAIMS',
        message: 'User type not properly configured. Please contact support.' 
      }, { status: 403 });
    }

    const userType = customClaims.userType as UserType;
    const role = customClaims.role as UserRole;
    const tenantId = customClaims.tenantId;
    const tenantSlug = customClaims.tenantSlug;

    console.log('[SERVER] User context:', { userType, role, tenantId, tenantSlug });

    // Set secure HttpOnly cookies
    const response = NextResponse.json({ 
      ok: true, 
      uid, 
      email, 
      userType,
      roles: { 
        platformRole: userType === 'platform_admin' ? role : null,
        tenantRole: userType === 'merchant_admin' ? role : null,
        tenantSlug 
      }
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

    // Set user type cookie
    response.cookies.set('user_type', userType, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set email cookie
    response.cookies.set('email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set role cookies
    if (userType === 'platform_admin' && role) {
      response.cookies.set('platform_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    if (userType === 'merchant_admin' && role) {
      response.cookies.set('tenant_role', role, {
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

    if (tenantId) {
      response.cookies.set('tenant_id', tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return response;
  } catch (err: any) {
    console.error("[SERVER] Session creation error", {
      name: err?.name,
      code: err?.code,
      message: err?.message,
    });
    return NextResponse.json(
      { ok: false, error: err?.code || "SESSION_ERROR", message: err?.message },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true });
    
    // Clear all auth cookies
    const cookiesToClear = ['session', 'uid', 'user_type', 'email', 'platform_role', 'tenant_role', 'tenant_slug', 'tenant_id'];
    
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