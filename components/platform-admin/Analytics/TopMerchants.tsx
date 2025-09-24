import { getTenantDocuments } from "@/lib/firebase/tenant";

export default async function TopMerchants() {
  // Fetch data from Firestore
  const allTenants = await getTenantDocuments('tenants', '');
  const allProducts = await getTenantDocuments('products', '');
  const allCategories = await getTenantDocuments('categories', '');
  
  // Sort by creation date and take top 10
  const merchants = allTenants
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((merchant: any) => ({
      ...merchant,
      products: allProducts.filter((p: any) => p.tenantId === merchant.id).map((p: any) => ({ id: p.id })),
      categories: allCategories.filter((c: any) => c.tenantId === merchant.id).map((c: any) => ({ id: c.id }))
    }));

  // Mock performance data - in a real app, you'd track actual metrics
  const merchantsWithStats = merchants.map((merchant: any) => ({
    ...merchant,
    // Mock stats
    pageViews: Math.floor(Math.random() * 10000) + 1000,
    revenue: Math.floor(Math.random() * 50000) + 5000,
    conversionRate: (Math.random() * 5 + 1).toFixed(1)
  }));

  const topMerchants = merchantsWithStats
    .sort((a: any, b: any) => b.pageViews - a.pageViews)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Merchants</h3>
      
      <div className="space-y-4">
        {topMerchants.map((merchant: any, index: number) => (
          <div key={merchant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                <div className="text-sm text-gray-500">/{merchant.slug}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {merchant.pageViews.toLocaleString()} views
              </div>
              <div className="text-sm text-gray-500">
                ${merchant.revenue.toLocaleString()} revenue
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {topMerchants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No merchant data available</p>
        </div>
      )}
    </div>
  );
}
