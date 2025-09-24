import { getTenantDocuments } from "@/lib/firebase/tenant";

export default async function ActivityFeed() {
  // Fetch recent activity - this is a simplified version
  // In a real app, you'd have an activity log table
  const allTenants = await getTenantDocuments('tenants', '');
  const recentTenants = allTenants
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((tenant: any) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      status: tenant.status
    }));

  const activities = recentTenants.map((tenant: any) => ({
    id: tenant.id,
    type: "merchant_created",
    title: `New merchant created: ${tenant.name}`,
    description: `Store slug: ${tenant.slug}`,
    timestamp: tenant.createdAt,
    status: tenant.status
  }));

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === "ACTIVE" ? "bg-green-500" : "bg-yellow-500"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
