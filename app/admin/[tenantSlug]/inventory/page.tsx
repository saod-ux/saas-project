import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import InventorySummary from "@/components/admin/InventorySummary";
import InventoryAlerts from "@/components/admin/InventoryAlerts";

export default async function InventoryPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor stock levels, track movements, and manage inventory alerts
        </p>
      </div>

      <InventorySummary tenantSlug={tenantSlug} />
      <InventoryAlerts tenantSlug={tenantSlug} />
    </div>
  );
}

