import { getTenantDocuments } from "@/lib/db";

export default async function RevenueOverview() {
  // Mock revenue data - replace with actual billing calculations
  const totalRevenue = 125000;
  const monthlyRevenue = 28000;
  const activeSubscriptions = 78;
  const churnRate = 2.5;

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: "All time",
      icon: "💰",
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${monthlyRevenue.toLocaleString()}`,
      subtitle: "This month",
      icon: "📈",
      color: "text-blue-600"
    },
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.toString(),
      subtitle: "Paying customers",
      icon: "👥",
      color: "text-purple-600"
    },
    {
      title: "Churn Rate",
      value: `${churnRate}%`,
      subtitle: "Monthly churn",
      icon: "📉",
      color: "text-red-600"
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


