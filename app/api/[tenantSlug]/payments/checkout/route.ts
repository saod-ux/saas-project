import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAndRole } from '@/lib/rbac';
import { getPaymentAdapter } from '@/lib/payments/factory';
import { createDocument } from '@/lib/firebase/tenant';
import { logAction } from '@/lib/rbac';
import { z } from 'zod';

const checkoutSchema = z.object({
  amountMinor: z.number().positive(),
  currency: z.string().min(3).max(3),
  orderId: z.string().optional(),
  customer: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }).optional(),
  redirectUrls: z.object({
    success: z.string().url(),
    cancel: z.string().url(),
    failure: z.string().url()
  })
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Check tenant access and role
    const authResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, tenant } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    // Get payment adapter
    const adapter = await getPaymentAdapter(tenant.id);
    if (!adapter) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 400 }
      );
    }

    // Create hosted checkout
    const checkoutResult = await adapter.createHostedCheckout({
      tenantId: tenant.id,
      amountMinor: validatedData.amountMinor,
      currency: validatedData.currency,
      orderId: validatedData.orderId,
      customer: validatedData.customer,
      redirectUrls: validatedData.redirectUrls
    });

    // Create payment record
    const payment = await createDocument('payments', {
      tenantId: tenant.id,
      orderId: validatedData.orderId,
      userId: user.id,
      provider: 'TAP', // TODO: Get from config
      externalId: checkoutResult.externalId,
      status: 'PENDING',
      amountMinor: validatedData.amountMinor,
      currency: validatedData.currency,
      rawPayload: {
        checkoutData: validatedData,
        externalId: checkoutResult.externalId
      }
    });

    // Log action
    await logAction({
      actorUserId: user.id,
      actorRole: 'USER',
      action: 'PAYMENT_CHECKOUT_CREATED',
      targetType: 'PAYMENT',
      targetId: payment.id,
      tenantId: tenant.id,
      meta: {
        amountMinor: validatedData.amountMinor,
        currency: validatedData.currency,
        orderId: validatedData.orderId
      },
      request
    });

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl: checkoutResult.redirectUrl,
        paymentId: payment.id
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

