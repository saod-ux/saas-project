import { getTenantDocuments } from "@/lib/db";

export default async function MetricsCards() {
  // Fetch key metrics from database
  const [
    totalMerchants,
    activeMerchants,
    totalUsers,
    totalRevenue
  ] = await Promise.all([
    // Get total merchants count
    (async () => {
      const tenants = await getTenantDocuments('tenants', '');
      return tenants.length;
    })(),
    // Get active merchants count
    (async () => {
      const tenants = await getTenantDocuments('tenants', '');
      return tenants.filter((t: any) => t.status === 'ACTIVE').length;
    })(),
    // Get total users count
    (async () => {
      const users = await getTenantDocuments('users', '');
      return users.length;
    })(),
    // Mock revenue calculation - replace with actual billing data
    125000
  ]);

  const metrics = [
    {
      title: "Total Merchants",
      value: totalMerchants,
      change: "+12%",
      changeType: "positive" as const,
      icon: "🏪"
    },
    {
      title: "Active Merchants", 
      value: activeMerchants,
      change: "+8%",
      changeType: "positive" as const,
      icon: "✅"
    },
    {
      title: "Total Users",
      value: totalUsers,
      change: "+15%",
      changeType: "positive" as const,
      icon: "👥"
    },
    {
      title: "Monthly Revenue",
      value: totalRevenue,
      change: "+22%",
      changeType: "positive" as const,
      icon: "💰"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value.toLocaleString()}</p>
            </div>
            <div className="text-2xl">{metric.icon}</div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              metric.changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}>
              {metric.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}
