import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({ params }: {
  params: Promise<{ tenantSlug: string; id: string }>;
}) {
  const { tenantSlug, id } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get the specific product
  let product = null;
  try {
    const allProducts = await getTenantDocuments('products', tenant.id);
    product = allProducts.find((p: any) => p.id === id && p.status === 'active');
  } catch (error) {
    console.error("Error fetching product:", error);
  }

  if (!product) {
    return notFound();
  }

  // Get related products (same category)
  let relatedProducts = [];
  try {
    const allProducts = await getTenantDocuments('products', tenant.id);
    relatedProducts = allProducts
      .filter((p: any) => 
        p.id !== id && 
        p.status === 'active' && 
        p.primaryCategoryId === product.primaryCategoryId
      )
      .slice(0, 4);
  } catch (error) {
    console.error("Error fetching related products:", error);
  }

  return (
    <ProductDetailClient 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      product={{
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]),
        gallery: product.gallery || [],
        status: product.status,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        isFeatured: product.isFeatured,
        inventory: product.inventory || { quantity: 0, trackInventory: false, allowOutOfStockPurchases: true }
      }}
      relatedProducts={relatedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        primaryImageUrl: p.imageUrl || (p.gallery && p.gallery[0]),
        status: p.status,
        isBestSeller: p.isBestSeller,
        isNewArrival: p.isNewArrival,
        isFeatured: p.isFeatured
      }))}
    />
  );
}