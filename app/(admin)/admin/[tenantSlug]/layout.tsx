import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/services/tenant";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({ params, children }: {
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader 
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl
        }} 
        tenantSlug={tenantSlug} 
      />
      <div className="flex">
        <AdminSidebar tenantSlug={tenantSlug} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}