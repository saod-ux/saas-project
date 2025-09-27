import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get categories
  let categories = [];
  try {
    categories = await getTenantDocuments('categories', tenant.id);
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <CategoriesClient 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
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