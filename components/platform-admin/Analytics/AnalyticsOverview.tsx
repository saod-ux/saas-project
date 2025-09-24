import { getTenantDocuments } from "@/lib/firebase/tenant";

export default async function AnalyticsOverview() {
  // Fetch all data from Firestore
  const allTenants = await getTenantDocuments('tenants', '');
  const allUsers = await getTenantDocuments('users', '');
  
  const totalMerchants = allTenants.length;
  const activeMerchants = allTenants.filter((t: any) => t.status === "ACTIVE").length;
  const totalUsers = allUsers.length;

  // Mock analytics data - replace with actual analytics
  const metrics = [
    {
      title: "Platform Growth",
      value: "+15.2%",
      subtitle: "vs last month",
      icon: "📈",
      color: "text-green-600"
    },
    {
      title: "Active Users",
      value: "2,450",
      subtitle: "last 30 days",
      icon: "👥",
      color: "text-blue-600"
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      subtitle: "trial to paid",
      icon: "🎯",
      color: "text-purple-600"
    },
    {
      title: "Support Tickets",
      value: "23",
      subtitle: "open tickets",
      icon: "🎫",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </p>
              <p className="text-xs text-gray-500">{metric.subtitle}</p>
            </div>
            <div className="text-2xl">{metric.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
