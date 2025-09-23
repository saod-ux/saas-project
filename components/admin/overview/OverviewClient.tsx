"use client";

import { StatsCard } from "@/components/admin/overview/StatsCard";
import { QuickActions } from "@/components/admin/overview/QuickActions";
import { RecentOrdersTable } from "@/components/admin/overview/RecentOrdersTable";
import { LowStockAlert } from "@/components/admin/overview/LowStockAlert";
import { PageHelp } from "@/components/admin/PageHelp";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

interface OverviewClientProps {
  tenantSlug: string;
  dashboardData: {
    stats: any;
    orders: any[];
    lowStock: any[];
  };
}

export default function OverviewClient({ tenantSlug, dashboardData }: OverviewClientProps) {

      return (
        <div className="space-y-8" dir="rtl">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">نظرة عامة</h1>
                <p className="text-gray-600">مرحباً بعودتك! إليك ما يحدث في متجرك اليوم.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">آخر تحديث</div>
                  <div className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('ar-KW')}</div>
                </div>
                <PageHelp pageKey="overview" locale="ar" />
              </div>
            </div>
          </div>

      {/* Stats Grid */}
      {isFeatureEnabled("revenueDashboard") && dashboardData.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي المنتجات"
            value={dashboardData.stats.totals.products}
            icon={<Package className="h-4 w-4" />}
          />
          <StatsCard
            title="الطلبات اليوم"
            value={dashboardData.stats.totals.ordersToday}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <StatsCard
            title="الطلبات هذا الأسبوع"
            value={dashboardData.stats.totals.ordersThisWeek}
            delta={dashboardData.stats.deltas.ordersPct}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatsCard
            title="الإيرادات هذا الأسبوع"
            value={new Intl.NumberFormat("ar-KW", {
              style: "currency",
              currency: "KWD",
            }).format(dashboardData.stats.totals.revenueThisWeek)}
            delta={dashboardData.stats.deltas.revenuePct}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        {isFeatureEnabled("quickActions") && (
          <div className="lg:col-span-1">
              <QuickActions tenantSlug={tenantSlug} locale="ar" />
          </div>
        )}

        {/* Recent Orders and Low Stock */}
        <div className="lg:col-span-2 space-y-6">
          {isFeatureEnabled("orderManagement") && (
                <RecentOrdersTable 
                  orders={dashboardData.orders} 
                  tenantSlug={tenantSlug} 
                  locale="ar" 
                />
          )}
          
          {isFeatureEnabled("inventoryAlerts") && (
            <LowStockAlert 
              products={dashboardData.lowStock} 
              tenantSlug={tenantSlug} 
              locale="ar" 
            />
          )}
        </div>
      </div>
    </div>
  );
}
