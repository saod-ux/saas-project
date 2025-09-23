import { Suspense } from "react";
import PlansManager from "@/components/platform-admin/Plans/PlansManager";
import { PageHelp } from "@/components/admin/PageHelp";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Manage plans and feature limits for merchants</p>
        </div>
        <PageHelp pageKey="platform.plans" locale="en" />
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <PlansManager />
      </Suspense>
    </div>
  );
}


