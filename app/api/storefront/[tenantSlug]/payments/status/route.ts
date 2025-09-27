import { NextRequest, NextResponse } from 'next/server';
import { requireUserType } from '@/lib/auth-middleware';
import { UserType } from '@/lib/auth-types';
import { ok, errorResponse, badRequest } from '@/lib/http/responses';
import { paymentService } from '@/lib/services/payment';
import { withLogging } from '@/lib/logging/middleware';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PaymentStatusSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  provider: z.string().min(1, 'Payment provider is required'),
});

/**
 * POST /api/storefront/[tenantSlug]/payments/status
 * Get payment status for a transaction
 */
export const POST = withLogging(async (
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) => {
  // Authentication - customer only
  const userTypeCheck = requireUserType(request, 'customer', request.nextUrl.pathname);
  if (userTypeCheck) return userTypeCheck;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = PaymentStatusSchema.safeParse(body);
    
    if (!validationResult.success) {
      return badRequest('Invalid request data', {
        details: validationResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { transactionId, provider } = validationResult.data;

    // Get payment status
    const paymentStatus = await paymentService.getPaymentStatus(provider, transactionId);

    if (paymentStatus.error) {
      return errorResponse(paymentStatus.error, 400);
    }

    // Return payment status
    return ok({
      transactionId: paymentStatus.transactionId,
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      processedAt: paymentStatus.processedAt,
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return errorResponse('Failed to check payment status');
  }
});

