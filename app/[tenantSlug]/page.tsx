import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import StorefrontHomepage from "@/components/storefront/StorefrontHomepage";

export default async function StorefrontPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get products
  let featuredProducts = [];
  let bestSellers = [];
  let newArrivals = [];
  try {
    const allProducts = await getTenantDocuments('products', tenant.id);
    featuredProducts = allProducts
      .filter((product: any) => product.status === 'active' && product.isFeatured)
      .slice(0, 8);
    bestSellers = allProducts
      .filter((product: any) => product.status === 'active' && product.isBestSeller)
      .slice(0, 8);
    newArrivals = allProducts
      .filter((product: any) => product.status === 'active' && product.isNewArrival)
      .slice(0, 8);
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Get categories
  let categories = [];
  try {
    categories = await getTenantDocuments('categories', tenant.id);
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <StorefrontHomepage 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      featuredProducts={featuredProducts.map(product => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]),
        status: product.status,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        inventory: product.inventory || { quantity: 0, trackInventory: false, allowOutOfStockPurchases: true }
      }))}
      bestSellers={bestSellers.map(product => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]),
        status: product.status,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        inventory: product.inventory || { quantity: 0, trackInventory: false, allowOutOfStockPurchases: true }
      }))}
      newArrivals={newArrivals.map(product => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]),
        status: product.status,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        inventory: product.inventory || { quantity: 0, trackInventory: false, allowOutOfStockPurchases: true }
      }))}
      categories={categories.map(category => ({
        id: category.id,
        name: category.name,
        nameAr: category.nameAr,
        slug: category.slug,
        imageUrl: category.imageUrl,
        description: category.description
      }))}
    />
  );
}
