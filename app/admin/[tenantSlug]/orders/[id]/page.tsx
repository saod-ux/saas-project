import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail';

interface AdminOrderDetailPageProps {
  params: {
    tenantSlug: string;
    id: string;
  };
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { tenantSlug, id } = params;

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
          <AdminOrderDetail tenant={tenant} orderId={id} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading admin order detail:', error);
    notFound();
  }
}