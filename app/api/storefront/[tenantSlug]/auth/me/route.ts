import { NextRequest, NextResponse } from 'next/server';
import { getTenantDocuments } from '@/lib/db';
import { loadTenantBySlug } from '@/lib/loadTenant';
import { getTenantUserById } from '@/lib/tenant-user';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params;
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Load tenant
    const tenant = await loadTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Verify customer belongs to this tenant
    if (decoded.tenantId !== tenant.id) {
      return NextResponse.json(
        { ok: false, error: 'Invalid tenant' },
        { status: 403 }
      );
    }

    // Get customer data
    const customer = await getTenantUserById(tenant.id, decoded.customerId);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Return customer data
    return NextResponse.json({
      ok: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          isGuest: customer.isGuest,
          createdAt: customer.createdAt,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to get customer data' },
      { status: 500 }
    );
  }
}

