import { NextRequest, NextResponse } from 'next/server';
import { requireUserType, requireRole, requireTenantAccess } from '@/lib/auth-middleware';
import { UserType, UserRole } from '@/lib/auth-types';
import { ok, errorResponse, badRequest, notFound } from '@/lib/http/responses';
import { UpdateOrderSchema } from '@/lib/validation/order';
import { OrderBusinessRules } from '@/lib/business-rules/order';
import { getTenantDocuments, updateDocument, deleteDocument } from '@/lib/db';
import { withBusinessRules } from '@/lib/business-rules/middleware';
import { withValidation } from '@/lib/validation/middleware';
import { withLogging } from '@/lib/logging/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/[tenantSlug]/orders/[id]
 * Get a specific order by ID
 */
export const GET = withLogging(async (
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) => {
  // Authentication and authorization
  const userTypeCheck = requireUserType(request, 'merchant_admin', request.nextUrl.pathname);
  if (userTypeCheck) return userTypeCheck;

  const tenantAccessCheck = requireTenantAccess(request, params.tenantSlug, request.nextUrl.pathname);
  if (tenantAccessCheck) return tenantAccessCheck;

  const roleCheck = requireRole(request, ['owner', 'admin', 'staff'], request.nextUrl.pathname);
  if (roleCheck) return roleCheck;

  try {
    // Get tenant ID
    const tenants = await getTenantDocuments('tenants', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    if (!tenant) {
      return notFound('Tenant not found');
    }

    // Get order from database
    const orders = await getTenantDocuments('orders', tenant.id);
    const order = orders.find((o: any) => o.id === params.id);

    if (!order) {
      return notFound('Order not found');
    }

    return ok({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    return errorResponse('Failed to fetch order');
  }
});

/**
 * PUT /api/admin/[tenantSlug]/orders/[id]
 * Update a specific order
 */
export const PUT = withLogging(
  withValidation(UpdateOrderSchema)(
    async (
      request: NextRequest,
      { params }: { params: { tenantSlug: string; id: string } },
      validatedData: any
    ) => {
      // Authentication and authorization
      const userTypeCheck = requireUserType(request, 'merchant_admin', request.nextUrl.pathname);
      if (userTypeCheck) return userTypeCheck;

      const tenantAccessCheck = requireTenantAccess(request, params.tenantSlug, request.nextUrl.pathname);
      if (tenantAccessCheck) return tenantAccessCheck;

      const roleCheck = requireRole(request, ['owner', 'admin'], request.nextUrl.pathname);
      if (roleCheck) return roleCheck;

      try {
        // Get tenant ID
        const tenants = await getTenantDocuments('tenants', '');
        const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
        if (!tenant) {
          return notFound('Tenant not found');
        }

        // Get current order
        const orders = await getTenantDocuments('orders', tenant.id);
        const currentOrder = orders.find((o: any) => o.id === params.id);

        if (!currentOrder) {
          return notFound('Order not found');
        }

        // Validate order update
        const validationResult = await OrderBusinessRules.validateOrderUpdate(
          params.id,
          validatedData,
          currentOrder
        );

        if (!validationResult.success) {
          return badRequest(validationResult.error || 'Order update validation failed', {
            code: validationResult.code,
            details: validationResult.details
          });
        }

        // Prepare update data
        const updateData = {
          ...validatedData,
          updatedAt: new Date().toISOString(),
        };

        // Update order in database
        const updatedOrder = await updateDocument('orders', params.id, updateData);

        return ok({
          order: updatedOrder,
          message: 'Order updated successfully'
        });

      } catch (error) {
        console.error('Error updating order:', error);
        return errorResponse('Failed to update order');
      }
    }
  )
);

/**
 * DELETE /api/admin/[tenantSlug]/orders/[id]
 * Delete a specific order (soft delete by changing status to cancelled)
 */
export const DELETE = withLogging(async (
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) => {
  // Authentication and authorization
  const userTypeCheck = requireUserType(request, 'merchant_admin', request.nextUrl.pathname);
  if (userTypeCheck) return userTypeCheck;

  const tenantAccessCheck = requireTenantAccess(request, params.tenantSlug, request.nextUrl.pathname);
  if (tenantAccessCheck) return tenantAccessCheck;

  const roleCheck = requireRole(request, ['owner', 'admin'], request.nextUrl.pathname);
  if (roleCheck) return roleCheck;

  try {
    // Get tenant ID
    const tenants = await getTenantDocuments('tenants', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    if (!tenant) {
      return notFound('Tenant not found');
    }

    // Get current order
    const orders = await getTenantDocuments('orders', tenant.id);
    const currentOrder = orders.find((o: any) => o.id === params.id);

    if (!currentOrder) {
      return notFound('Order not found');
    }

    // Check if order can be cancelled
    const immutableStatuses = ['delivered', 'cancelled', 'refunded'];
    if (immutableStatuses.includes(currentOrder.status)) {
      return badRequest(`Cannot cancel order with status: ${currentOrder.status}`, {
        code: 'IMMUTABLE_ORDER',
        details: { currentStatus: currentOrder.status }
      });
    }

    // Soft delete by changing status to cancelled
    const updateData = {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      internalNotes: `${currentOrder.internalNotes || ''}\n[${new Date().toISOString()}] Order cancelled by admin`.trim(),
    };

    const updatedOrder = await updateDocument('orders', params.id, updateData);

    return ok({
      order: updatedOrder,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return errorResponse('Failed to cancel order');
  }
});

