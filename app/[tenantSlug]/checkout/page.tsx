import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/storefront/CheckoutForm";

export default async function Checkout({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <CheckoutForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
