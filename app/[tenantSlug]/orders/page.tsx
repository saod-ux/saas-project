import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { CustomerOrders } from '@/components/storefront/CustomerOrders';

interface CustomerOrdersPageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function CustomerOrdersPage({ params }: CustomerOrdersPageProps) {
  const { tenantSlug } = params;

  try {
    // Get tenant info
    const tenants = await getDocument('tenants', '', '');
    const tenant = tenants.find((t: any) => t.slug === tenantSlug);
    
    if (!tenant) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <CustomerOrders tenant={tenant} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading customer orders:', error);
    notFound();
  }
}