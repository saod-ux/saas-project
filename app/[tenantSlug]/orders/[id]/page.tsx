import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { OrderConfirmation } from '@/components/storefront/OrderConfirmation';

interface OrderConfirmationPageProps {
  params: {
    tenantSlug: string;
    id: string;
  };
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { tenantSlug, id } = params;

  try {
    // Get tenant info
    const tenants = await getDocument('tenants', '', '');
    const tenant = tenants.find((t: any) => t.slug === tenantSlug);
    
    if (!tenant) {
      notFound();
    }

    // Get order details
    const order = await getDocument('orders', id, tenant.id);
    
    if (!order) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <OrderConfirmation order={order} tenant={tenant} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading order confirmation:', error);
    notFound();
  }
}