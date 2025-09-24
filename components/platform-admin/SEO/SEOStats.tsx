import { getTenantDocuments } from "@/lib/firebase/tenant";
import { Search, Eye, Globe, AlertTriangle } from "lucide-react";

export default async function SEOStats() {
  // Get all tenants with their SEO settings
  const tenants = await getTenantDocuments('tenants', '');

  // Analyze SEO settings
  const stats = {
    totalMerchants: tenants.length,
    withMetaTitle: 0,
    withMetaDescription: 0,
    withOgImage: 0,
    withCustomDomain: 0,
    incomplete: 0,
  };

  tenants.forEach((tenant: any) => {
    const settings = tenant.settings as any; // Changed from settingsJson to settings
    const seo = settings?.seo || {};
    
    if (seo.metaTitle) stats.withMetaTitle++;
    if (seo.metaDescription) stats.withMetaDescription++;
    if (seo.ogImageUrl) stats.withOgImage++;
    if (seo.redirectToCustomDomain) stats.withCustomDomain++;
    
    // Check if SEO is incomplete
    if (!seo.metaTitle || !seo.metaDescription) {
      stats.incomplete++;
    }
  });

  const statsCards = [
    {
      title: "Total Merchants",
      value: stats.totalMerchants,
      icon: Globe,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "With Meta Title",
      value: stats.withMetaTitle,
      icon: Search,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "With Meta Description",
      value: stats.withMetaDescription,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Incomplete SEO",
      value: stats.incomplete,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}




