import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import CreateProductForm from "@/components/admin/CreateProductForm";

export default async function CreateProductPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
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
    <CreateProductForm 
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