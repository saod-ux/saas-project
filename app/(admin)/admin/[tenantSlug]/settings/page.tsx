import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import SettingsPage from "@/components/admin/SettingsPage";

export default async function AdminSettingsPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <SettingsPage 
      tenant={tenant}
      tenantSlug={tenantSlug}
    />
  );
}