import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get dashboard data
  let stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  };

  try {
    const [products, orders, customers] = await Promise.all([
      getTenantDocuments('products', tenant.id),
      getTenantDocuments('orders', tenant.id),
      getTenantDocuments('users', tenant.id)
    ]);

    stats = {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  return (
    <AdminDashboard 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      stats={stats}
    />
  );
}