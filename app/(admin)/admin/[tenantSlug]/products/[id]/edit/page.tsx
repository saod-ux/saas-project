import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import EditProductForm from "@/components/admin/EditProductForm";

export default async function EditProductPage({ params }: {
  params: Promise<{ tenantSlug: string; id: string }>;
}) {
  const { tenantSlug, id } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get the product
  let product = null;
  try {
    const products = await getTenantDocuments('products', tenant.id);
    product = products.find((p: any) => p.id === id);
    
    if (!product) {
      return notFound();
    }

    // Convert Firestore timestamps to strings for client components
    product = {
      ...product,
      createdAt: product.createdAt?.toISOString ? product.createdAt.toISOString() : product.createdAt,
      updatedAt: product.updatedAt?.toISOString ? product.updatedAt.toISOString() : product.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }

  // Get categories for the dropdown
  let categories = [];
  try {
    const rawCategories = await getTenantDocuments('categories', tenant.id);
    categories = rawCategories.map((category: any) => ({
      id: category.id,
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <EditProductForm 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      product={product}
      categories={categories}
    />
  );
}

