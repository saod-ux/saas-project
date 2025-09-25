import { NextRequest, NextResponse } from 'next/server';
import { getTenantDocuments, createDocument } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, uid, role = 'admin' } = await request.json();
    
    if (!email || !uid) {
      return NextResponse.json({ ok: false, error: 'Missing email or uid' }, { status: 400 });
    }

    // Create platform user
    const platformUser = {
      uid,
      email,
      role: 'platformAdmin', // Give platform admin role
      createdAt: new Date().toISOString(),
    };

    await createDocument('platformUsers', platformUser);

    // Also create a tenant user for demo
    const tenantUser = {
      uid,
      email,
      role: 'admin', // Give tenant admin role
      createdAt: new Date().toISOString(),
    };

    // Get the first tenant or create a default one
    const tenants = await getTenantDocuments('tenants', '');
    let tenantId = 'demo-store';
    
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    } else {
      // Create a default tenant
      const defaultTenant = {
        name: 'Demo Store',
        slug: 'demo-store',
        createdAt: new Date().toISOString(),
      };
      await createDocument('tenants', defaultTenant);
    }

    await createDocument('tenantUsers', tenantUser);

    return NextResponse.json({
      ok: true,
      message: 'Test user created successfully',
      platformUser,
      tenantUser: { ...tenantUser, tenantId },
    });
  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
