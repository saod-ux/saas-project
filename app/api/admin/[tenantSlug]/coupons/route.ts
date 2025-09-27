import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAndRole } from '@/lib/rbac';
import { CouponService } from '@/lib/services/coupons';
import { CreateCouponSchema } from '@/lib/validation/coupon';
import { log } from '@/lib/logger';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'GET', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'STAFF']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant } = rbacResult;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');
    
    const filters: any = {};
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (type) filters.type = type;

    const coupons = await CouponService.getCoupons(tenant.id, filters);

    return NextResponse.json({ ok: true, data: coupons });
  } catch (error) {
    logger.error('Error fetching coupons:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'POST', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant, user } = rbacResult;

    const body = await request.json();
    const validatedData = CreateCouponSchema.parse(body);

    const coupon = await CouponService.createCoupon(tenant.id, {
      ...validatedData,
      createdBy: user.uid
    });

    return NextResponse.json({ ok: true, data: coupon, message: 'Coupon created successfully' }, { status: 201 });
  } catch (error) {
    logger.error('Error creating coupon:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid coupon data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to create coupon' 
    }, { status: 500 });
  }
}

