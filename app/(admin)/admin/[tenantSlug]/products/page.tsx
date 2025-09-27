import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import ProductsPage from "@/components/admin/ProductsPage";

export default async function AdminProductsPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get products
  let products = [];
  try {
    const rawProducts = await getTenantDocuments('products', tenant.id);
    // Convert to plain JSON objects to avoid serialization issues
    products = rawProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      costPrice: product.costPrice,
      sku: product.sku,
      barcode: product.barcode,
      weight: product.weight,
      status: (product.status || 'draft').toLowerCase(),
      stockQuantity: product.stockQuantity || 0,
      lowStockThreshold: product.lowStockThreshold || 5,
      visibility: product.visibility,
      inventory: product.inventory ? {
        quantity: product.inventory.quantity,
        trackInventory: product.inventory.trackInventory,
        allowOutOfStockPurchases: product.inventory.allowOutOfStockPurchases,
      } : null,
      images: product.images || [],
      gallery: product.gallery || [],
      primaryCategoryId: product.primaryCategoryId,
      categories: product.categories || [],
      tags: product.tags || [],
      isBestSeller: product.isBestSeller || false,
      isNewArrival: product.isNewArrival || false,
      isFeatured: product.isFeatured || false,
      seo: product.seo || null,
      createdAt: product.createdAt ? (typeof product.createdAt === 'string' ? product.createdAt : (product.createdAt?.toISOString ? product.createdAt.toISOString() : new Date().toISOString())) : null,
      updatedAt: product.updatedAt ? (typeof product.updatedAt === 'string' ? product.updatedAt : (product.updatedAt?.toISOString ? product.updatedAt.toISOString() : new Date().toISOString())) : null,
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <ProductsPage 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      products={products}
    />
  );
}
