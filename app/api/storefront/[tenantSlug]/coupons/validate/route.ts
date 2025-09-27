import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/services/coupons';
import { ValidateCouponSchema } from '@/lib/validation/coupon';
import { log } from '@/lib/logger';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'POST', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    // Get tenant ID from slug
    const { getTenantDocuments } = await import('@/lib/db');
    const tenants = await getTenantDocuments('tenants', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { couponCode, orderData } = ValidateCouponSchema.parse(body);

    const validation = await CouponService.validateCoupon(tenant.id, couponCode, orderData);

    if (validation.isValid) {
      return NextResponse.json({ 
        ok: true, 
        data: {
          isValid: true,
          coupon: validation.coupon,
          discountAmount: validation.discountAmount
        }
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: validation.error,
        code: validation.code
      }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error validating coupon:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to validate coupon' 
    }, { status: 500 });
  }
}

