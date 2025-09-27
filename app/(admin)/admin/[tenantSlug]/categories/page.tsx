import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import CategoriesPage from "@/components/admin/CategoriesPage";

export default async function AdminCategoriesPage({ params }: {
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
    const rawCategories = await getTenantDocuments('categories', tenant.id);
    // Convert to plain JSON objects to avoid serialization issues
    categories = rawCategories.map((category: any) => ({
      id: category.id,
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
      imageUrl: category.imageUrl,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt ? (typeof category.createdAt === 'string' ? category.createdAt : (category.createdAt?.toISOString ? category.createdAt.toISOString() : new Date().toISOString())) : null,
      updatedAt: category.updatedAt ? (typeof category.updatedAt === 'string' ? category.updatedAt : (category.updatedAt?.toISOString ? category.updatedAt.toISOString() : new Date().toISOString())) : null,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <CategoriesPage 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
      categories={categories}
    />
  );
}
