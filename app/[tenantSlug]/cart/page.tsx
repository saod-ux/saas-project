import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import CartClient from "./CartClient";

export default async function CartPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <CartClient 
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl
      }}
      tenantSlug={tenantSlug}
    />
  );
}