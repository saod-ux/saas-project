import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { AdminOrderCreate } from '@/components/admin/AdminOrderCreate';

interface AdminOrderCreatePageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function AdminOrderCreatePage({ params }: AdminOrderCreatePageProps) {
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
          <AdminOrderCreate tenant={tenant} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading admin order create:', error);
    notFound();
  }
}

