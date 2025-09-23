import { Suspense } from "react";
import DomainManager from "@/components/platform-admin/Domains/DomainManager";
import DomainStats from "@/components/platform-admin/Domains/DomainStats";
import { PageHelp } from "@/components/admin/PageHelp";

export default function DomainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Domains</h1>
          <p className="text-gray-600">Manage custom domains across all merchants</p>
        </div>
        <PageHelp pageKey="platform.domains" locale="en" />
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <DomainStats />
      </Suspense>

      <Suspense fallback={
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <DomainManager />
      </Suspense>
    </div>
  );
}