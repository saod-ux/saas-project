import { NextRequest, NextResponse } from 'next/server';
import { requireUserType, requireRole, requireTenantAccess } from '@/lib/auth-middleware';
import { UserType, UserRole } from '@/lib/auth-types';
import { ok, errorResponse, badRequest, notFound } from '@/lib/http/responses';
import { OrderQuerySchema, CreateOrderSchema } from '@/lib/validation/order';
import { OrderBusinessRules } from '@/lib/business-rules/order';
import { getTenantDocuments, createDocument, updateDocument, getDocument } from '@/lib/db';
import { withBusinessRules } from '@/lib/business-rules/middleware';
import { withValidation } from '@/lib/validation/middleware';
import { withLogging } from '@/lib/logging/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/[tenantSlug]/orders
 * List orders for a tenant with filtering and pagination
 */
export const GET = withLogging(async (
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) => {
  // Authentication and authorization
  const userTypeCheck = requireUserType(request, 'merchant_admin', request.nextUrl.pathname);
  if (userTypeCheck) return userTypeCheck;

  const tenantAccessCheck = requireTenantAccess(request, params.tenantSlug, request.nextUrl.pathname);
  if (tenantAccessCheck) return tenantAccessCheck;

  const roleCheck = requireRole(request, ['owner', 'admin', 'staff'], request.nextUrl.pathname);
  if (roleCheck) return roleCheck;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate query parameters
    const validationResult = OrderQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return badRequest('Invalid query parameters', {
        details: validationResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const query = validationResult.data;

    // Get tenant ID
    const tenants = await getTenantDocuments('tenants', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    if (!tenant) {
      return notFound('Tenant not found');
    }

    // Get orders from database
    const orders = await getTenantDocuments('orders', tenant.id);

    // Apply filters
    let filteredOrders = orders;

    if (query.status) {
      filteredOrders = filteredOrders.filter((order: any) => order.status === query.status);
    }

    if (query.customerId) {
      filteredOrders = filteredOrders.filter((order: any) => order.customerId === query.customerId);
    }

    if (query.dateFrom) {
      filteredOrders = filteredOrders.filter((order: any) => 
        new Date(order.createdAt) >= query.dateFrom!
      );
    }

    if (query.dateTo) {
      filteredOrders = filteredOrders.filter((order: any) => 
        new Date(order.createdAt) <= query.dateTo!
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredOrders = filteredOrders.filter((order: any) =>
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customerEmail?.toLowerCase().includes(searchTerm) ||
        order.items?.some((item: any) => 
          item.name?.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Sort orders
    filteredOrders.sort((a: any, b: any) => {
      const aValue = a[query.sortBy];
      const bValue = b[query.sortBy];
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredOrders.length;
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Transform to summary format
    const orderSummaries = paginatedOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      status: order.status,
      total: order.total,
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return ok({
      orders: orderSummaries,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: endIndex < total,
        hasPrev: query.page > 1,
      },
      filters: {
        status: query.status,
        customerId: query.customerId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        search: query.search,
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return errorResponse('Failed to fetch orders');
  }
});

/**
 * POST /api/admin/[tenantSlug]/orders
 * Create a new order
 */
export const POST = withLogging(
  withValidation(CreateOrderSchema)(
    withBusinessRules(OrderBusinessRules.validateOrderCreation)(
      async (
        request: NextRequest,
        { params }: { params: { tenantSlug: string } },
        validatedData: any,
        businessRuleResult: any
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

          // Generate order number
          const orderNumber = OrderBusinessRules.generateOrderNumber(tenant.id);

          // Create order data
          const orderData = {
            ...validatedData,
            tenantId: tenant.id,
            orderNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Create order in database
          const createdOrder = await createDocument('orders', orderData);

          // Update inventory for each item
          const { InventoryService } = await import('@/lib/services/inventory');
          for (const item of validatedData.items) {
            const product = await getDocument('products', item.productId, tenant.id);
            if (product && product.inventory?.trackInventory) {
              await InventoryService.recordStockMovement(
                tenant.id,
                item.productId,
                'OUT',
                item.quantity,
                `Order ${orderNumber}`,
                createdOrder.id,
                'system' // System-generated order
              );
            }
          }

          return ok({
            order: createdOrder,
            message: 'Order created successfully'
          }, 201);

        } catch (error) {
          console.error('Error creating order:', error);
          return errorResponse('Failed to create order');
        }
      }
    )
  )
);
