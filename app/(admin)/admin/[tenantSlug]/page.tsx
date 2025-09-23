import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Overview({ params }: { params: { tenantSlug: string } }) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  
  if (!tenant) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Overview</h1>
        <div className="text-red-600">Tenant not found</div>
      </div>
    );
  }

  // Fetch counts with no-store cache to ensure fresh data
  // Handle case where models might not exist yet
  let products = 0;
  let categories = 0;
  let orders = 0;

  try {
    // Use Firebase Firestore to get counts
    const [productsData, categoriesData, ordersData] = await Promise.all([
      getTenantDocuments('products', tenant.id),
      getTenantDocuments('categories', tenant.id),
      getTenantDocuments('orders', tenant.id),
    ]);
    
    products = productsData.length;
    categories = categoriesData.length;
    orders = ordersData.length;
  } catch (error) {
    console.error("Error fetching counts:", error);
    // Use default values if models don't exist yet
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Overview</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Stat title="Products" value={products} />
        <Stat title="Categories" value={categories} />
        <Stat title="Orders" value={orders} />
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
