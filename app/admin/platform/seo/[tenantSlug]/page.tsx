import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import SEOForm from "@/components/platform-admin/SEO/SEOForm";
import { PageHelp } from "@/components/admin/PageHelp";

interface PageProps {
  params: { tenantSlug: string };
}

export default async function MerchantSEOPage({ params }: PageProps) {
  const tenant = await getTenantBySlug(params.tenantSlug);

  if (!tenant) {
    notFound();
  }

  const settings = tenant.settings as any;
  const seo = settings?.seo || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
          <p className="text-gray-600">
            Manage SEO settings for <span className="font-medium">{tenant.name}</span>
          </p>
        </div>
        <PageHelp pageKey="platform.seo.manage" locale="en" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">SEO Configuration</h3>
          <p className="text-sm text-gray-600">
            Configure search engine optimization settings for this merchant&apos;s storefront
          </p>
        </div>
        
        <div className="p-6">
          <SEOForm tenant={tenant} initialData={seo} />
        </div>
      </div>
    </div>
  );
}




