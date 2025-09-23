import MerchantDetailClient from "@/components/platform-admin/Merchants/MerchantDetailClient";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MerchantContentPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  console.log("MerchantContentPage: tenantSlug =", tenantSlug);
  console.log("MerchantContentPage: tenant =", tenant);

  if (!tenant) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug: Tenant Not Found</h1>
        <p>Tenant slug: {tenantSlug}</p>
        <p>getTenantBySlug returned: {JSON.stringify(tenant)}</p>
      </div>
    );
  }

  return <MerchantDetailClient tenant={tenant} />;
}
