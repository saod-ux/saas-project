import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getServerDb } from "@/lib/firebase/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReturnPolicyPage({ params }: {
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Get content settings (merchant override first, then platform default)
  let returnPolicy = null;
  try {
    const db = await getServerDb();
    
    // First, check for merchant-specific content override
    const merchantContentDoc = await db.collection('merchant-content').doc(tenant.id).get();
    if (merchantContentDoc.exists) {
      const merchantData = merchantContentDoc.data();
      if (merchantData?.policies?.returnPolicy?.enabled) {
        returnPolicy = merchantData.policies.returnPolicy;
      }
    }
    
    // If no merchant override or not enabled, check platform settings
    if (!returnPolicy) {
      const platformContentDoc = await db.collection('platform').doc('content-settings').get();
      if (platformContentDoc.exists) {
        const platformData = platformContentDoc.data();
        if (platformData?.policies?.returnPolicy?.enabled) {
          returnPolicy = platformData.policies.returnPolicy;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching content settings:", error);
  }

  // If return policy is not enabled, show 404
  if (!returnPolicy?.enabled) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {returnPolicy.title}
          </h1>
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {returnPolicy.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
