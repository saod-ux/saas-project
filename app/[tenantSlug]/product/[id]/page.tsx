import { prismaRW } from "@/lib/db";
import { loadTenantBySlug } from "@/lib/loadTenant";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const tenant = await loadTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Fetch the actual product from database with category info
  const product = await prismaRW.product.findFirst({
    where: {
      id: params.id,
      tenantId: tenant.id,
    },
    include: {
      primaryCategory: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Convert Decimal to number for client component
  const productForClient = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    customFields: product.customFields || [],
    categories: product.primaryCategory ? {
      name: product.primaryCategory.name,
      slug: product.primaryCategory.slug,
    } : null,
  };

  return <ProductPageClient product={productForClient} tenantSlug={params.tenantSlug} />;
}