import { Suspense } from "react";
import SEOTable from "@/components/platform-admin/SEO/SEOTable";
import SEOStats from "@/components/platform-admin/SEO/SEOStats";
import { PageHelp } from "@/components/admin/PageHelp";

export default function SEOPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Manage SEO settings across all merchants</p>
        </div>
        <PageHelp pageKey="platform.seo" locale="en" />
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
        <SEOStats />
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
        <SEOTable />
      </Suspense>
    </div>
  );
}






