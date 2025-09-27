import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import EditProductPage from "@/components/admin/EditProductPage";

export default async function EditProduct({ params }: {
  params: Promise<{ tenantSlug: string; id: string }>;
}) {
  const { tenantSlug, id } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get product
  let product = null;
  try {
    const products = await getTenantDocuments('products', tenant.id);
    product = products.find((p: any) => p.id === id);
  } catch (error) {
    console.error("Error fetching product:", error);
  }

  if (!product) {
    return notFound();
  }

  return (
    <EditProductPage 
      tenant={tenant}
      tenantSlug={tenantSlug}
      product={product}
    />
  );
}