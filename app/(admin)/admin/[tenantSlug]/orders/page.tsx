import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments } from "@/lib/db";
import { PageHelp } from "@/components/admin/PageHelp";
import { notFound } from "next/navigation";

export default async function Orders({ 
  params, 
  searchParams 
}: { 
  params: { tenantSlug: string };
  searchParams: { locale?: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  
  if (!tenant) {
    notFound();
  }
  
  // For now, return empty orders array since we don't have orders implemented yet
  const orders: any[] = [];

  const locale = searchParams.locale || 'en';

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <PageHelp pageKey="orders" locale={locale} />
      </div>
      <div className="rounded border bg-white divide-y">
        {orders.length > 0 ? (
          orders.map(o => (
            <div key={o.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{o.status}</div>
                <div className="text-sm">{o.total.toString()} {o.currency}</div>
              </div>
              <div className="text-sm text-neutral-600">
                {o.orderItems.length} item(s) · {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
