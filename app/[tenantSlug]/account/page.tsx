import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/services/tenant";
import CustomerAccountClient from "./CustomerAccountClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return {
    title: `Account - ${tenantSlug}`,
    description: `Manage your account at ${tenantSlug}`,
  };
}

export default async function CustomerAccountPage({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <CustomerAccountClient 
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
