import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { AdminOrders } from '@/components/admin/AdminOrders';

interface AdminOrdersPageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
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
        <div className="max-w-7xl mx-auto py-8 px-4">
          <AdminOrders tenant={tenant} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading admin orders:', error);
    notFound();
  }
}