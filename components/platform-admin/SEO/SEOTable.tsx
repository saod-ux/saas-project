import { prismaRW } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Settings, Search, Eye, Image } from "lucide-react";

export default async function SEOTable() {
  // Get all tenants with their SEO settings
  const tenants = await prismaRW.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      settingsJson: true,
    },
    orderBy: { createdAt: "desc" }
  });

  const getSEOStatus = (tenant: any) => {
    const settings = tenant.settingsJson as any;
    const seo = settings?.seo || {};
    
    const hasMetaTitle = !!seo.metaTitle;
    const hasMetaDescription = !!seo.metaDescription;
    const hasOgImage = !!seo.ogImageUrl;
    const hasCustomDomain = !!seo.redirectToCustomDomain;
    
    const completedFields = [hasMetaTitle, hasMetaDescription, hasOgImage].filter(Boolean).length;
    const totalFields = 3;
    
    if (completedFields === totalFields) {
      return {
        status: 'complete',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'Complete'
      };
    } else if (completedFields > 0) {
      return {
        status: 'partial',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        text: 'Partial'
      };
    } else {
      return {
        status: 'incomplete',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Incomplete'
      };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Merchant SEO Settings</h3>
        <p className="text-sm text-gray-600">Manage SEO settings for all merchants</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SEO Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meta Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meta Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OG Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Custom Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => {
              const settings = tenant.settingsJson as any;
              const seo = settings?.seo || {};
              const seoStatus = getSEOStatus(tenant);
              const StatusIcon = seoStatus.icon;
              
              return (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">/{tenant.slug}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${seoStatus.bgColor} ${seoStatus.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {seoStatus.text}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {seo.metaTitle ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">
                            {seo.metaTitle}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-500">Not set</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {seo.metaDescription ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">
                            {seo.metaDescription}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-500">Not set</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {seo.ogImageUrl ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">Set</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-500">Not set</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {seo.redirectToCustomDomain ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-500">Disabled</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/platform/seo/${tenant.slug}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Link>
                      <Link
                        href={`/${tenant.slug}`}
                        target="_blank"
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Store
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}




