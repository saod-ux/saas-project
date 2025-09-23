import { prisma } from "@/lib/prisma";

export default async function DomainStats() {
  // Since domains are stored as a field on Tenant model, count tenants with domains
  const [
    totalDomains,
    verifiedDomains,
    sslIssues
  ] = await Promise.all([
    prisma.tenant.count({ where: { domain: { not: null } } }),
    prisma.tenant.count({ where: { domain: { not: null } } }), // All domains are considered "verified" for now
    // Mock SSL issues count - in real app, you'd check SSL status
    3
  ]);

  const pendingDomains = 0; // No pending domains since we don't have verification logic yet

  const stats = [
    {
      title: "Total Domains",
      value: totalDomains,
      icon: "🌐",
      color: "text-blue-600"
    },
    {
      title: "Verified",
      value: verifiedDomains,
      icon: "✅",
      color: "text-green-600"
    },
    {
      title: "Pending",
      value: pendingDomains,
      icon: "⏳",
      color: "text-yellow-600"
    },
    {
      title: "SSL Issues",
      value: sslIssues,
      icon: "⚠️",
      color: "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </p>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
