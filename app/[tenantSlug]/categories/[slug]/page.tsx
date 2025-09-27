import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import CategoryDetailClient from "./CategoryDetailClient";

export default async function CategoryDetailPage({ params }: {
  params: Promise<{ tenantSlug: string; slug: string }>;
}) {
  const { tenantSlug, slug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get the specific category
  let category = null;
  try {
    const allCategories = await getTenantDocuments('categories', tenant.id);
    category = allCategories.find((c: any) => c.slug === slug);
  } catch (error) {
    console.error("Error fetching category:", error);
  }

  if (!category) {
    return notFound();
  }

  // Get products in this category
  let products = [];
  try {
    const allProducts = await getTenantDocuments('products', tenant.id);
    products = allProducts.filter((product: any) => 
      product.primaryCategoryId === category.id && product.status === 'active'
    );
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <CategoryDetailClient 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      category={{
        id: category.id,
        name: category.name,
        nameAr: category.nameAr,
        slug: category.slug,
        imageUrl: category.imageUrl,
        description: category.description
      }}
      products={products.map(product => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]),
        status: product.status,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        isFeatured: product.isFeatured
      }))}
    />
  );
}