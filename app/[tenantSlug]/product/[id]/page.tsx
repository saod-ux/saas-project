import { getTenantBySlug, getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Fetch the actual product from database with category info
  const products = await getTenantDocuments('products', tenant.id);
  const product = products.find((p: any) => p.id === params.id);

  if (!product) {
    notFound();
  }

  // Get categories for primary category info
  const categories = await getTenantDocuments('categories', tenant.id);
  const primaryCategory = product.primaryCategoryId ? 
    categories.find((c: any) => c.id === product.primaryCategoryId) : null;

  // Convert Decimal to number for client component
  const productForClient = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    customFields: product.customFields || [],
    categories: primaryCategory ? {
      name: primaryCategory.name,
      slug: primaryCategory.slug,
    } : null,
  };

  return <ProductPageClient product={productForClient} tenantSlug={params.tenantSlug} />;
}