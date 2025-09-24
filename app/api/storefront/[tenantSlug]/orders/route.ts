import { NextRequest, NextResponse } from 'next/server';
import { getTenantDocuments } from '@/lib/db';
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
    const orders = await getTenantDocuments('orders', tenant.id)
    const customerOrders = orders.filter((order: any) => order.tenantUserId === customer.id)
    
    // Get order items and products for each order
    const orderItems = await getTenantDocuments('orderItems', tenant.id)
    const products = await getTenantDocuments('products', tenant.id)
    
    const ordersWithItems = customerOrders.map((order: any) => {
      const items = orderItems.filter((item: any) => item.orderId === order.id)
      const itemsWithProducts = items.map((item: any) => {
        const product = products.find((p: any) => p.id === item.productId)
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.title,
            slug: product.slug,
            price: product.price,
            currency: product.currency,
            images: product.gallery || []
          } : null
        }
      })
      
      return {
        ...order,
        orderItems: itemsWithProducts
      }
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      ok: true,
      data: ordersWithItems
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

