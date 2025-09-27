import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import OrdersPage from "@/components/admin/OrdersPage";

export default async function AdminOrdersPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get orders
  let orders = [];
  try {
    orders = await getTenantDocuments('orders', tenant.id);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <OrdersPage 
      tenant={tenant}
      tenantSlug={tenantSlug}
      orders={orders}
    />
  );
}