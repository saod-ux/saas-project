import { getTenantDocuments } from "@/lib/firebase/tenant";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, ExternalLink, Settings, RefreshCw } from "lucide-react";

export default async function DomainsTable() {
  // Get all domains and tenants from Firestore
  const allDomains = await getTenantDocuments('domains', '');
  const allTenants = await getTenantDocuments('tenants', '');
  
  // Join domains with their tenant information
  const domains = allDomains
    .map((domain: any) => {
      const tenant = allTenants.find((t: any) => t.id === domain.tenantId);
      return {
        ...domain,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        } : null
      };
    })
    .filter((domain: any) => domain.tenant !== null) // Only include domains with valid tenants
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getDnsStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'INVALID':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getDnsStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return "Verified";
      case 'INVALID':
        return "Invalid";
      default:
        return "Pending";
    }
  };

  const getDnsStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return "bg-green-100 text-green-800";
      case 'INVALID':
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getSslStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return "bg-green-100 text-green-800";
      case 'ERROR':
        return "bg-red-100 text-red-800";
      case 'PENDING':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All Domains</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNS Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SSL Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Checked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {domains.map((domain: any) => (
              <tr key={domain.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getDnsStatusIcon(domain.dnsStatus)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {domain.domain}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{domain.tenant.name}</div>
                  <div className="text-sm text-gray-500">/{domain.tenant.slug}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDnsStatusColor(domain.dnsStatus)}`}>
                    {getDnsStatusText(domain.dnsStatus)}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSslStatusColor(domain.sslStatus)}`}>
                    {domain.sslStatus}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {domain.lastCheckedAt ? new Date(domain.lastCheckedAt).toLocaleDateString() : 'Never'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`https://${domain.domain}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit
                    </Link>
                    <Link
                      href={`/admin/${domain.tenant.slug}`}
                      target="_blank"
                      className="text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {domains.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-500">Merchants can add custom domains from their admin dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}
