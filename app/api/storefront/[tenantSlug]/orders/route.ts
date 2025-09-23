import { NextRequest, NextResponse } from 'next/server';
import { prismaRW } from '@/lib/db';
import { loadTenantBySlug } from '@/lib/loadTenant';
import { getCustomerWithSession } from '@/lib/customer-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params;
    
    // Load tenant
    const tenant = await loadTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get customer session
    const customer = await getCustomerWithSession(request, tenant.id);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get customer orders
    const orders = await prismaRW.order.findMany({
      where: {
        tenantId: tenant.id,
        tenantUserId: customer.id,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                currency: true,
                images: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      ok: true,
      data: orders
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

