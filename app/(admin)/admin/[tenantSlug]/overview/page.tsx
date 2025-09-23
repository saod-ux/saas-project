import { getTenantBySlug } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import OverviewClient from "@/components/admin/overview/OverviewClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface OverviewPageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ locale?: string }>;
}

async function fetchDashboardData(tenantSlug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const [statsRes, ordersRes, lowStockRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/${tenantSlug}/dashboard/stats`, { 
        cache: "no-store" 
      }),
      fetch(`${baseUrl}/api/admin/${tenantSlug}/dashboard/recent-orders?limit=10`, { 
        cache: "no-store" 
      }),
      fetch(`${baseUrl}/api/admin/${tenantSlug}/dashboard/low-stock`, { 
        cache: "no-store" 
      })
    ]);

    const [statsData, ordersData, lowStockData] = await Promise.all([
      statsRes.json(),
      ordersRes.json(),
      lowStockRes.json()
    ]);

    return {
      stats: statsData.ok ? statsData.data : null,
      orders: ordersData.ok ? ordersData.data : [],
      lowStock: lowStockData.ok ? lowStockData.data : []
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      stats: null,
      orders: [],
      lowStock: []
    };
  }
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { tenantSlug } = await params;
  
  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    notFound();
  }

  const dashboardData = await fetchDashboardData(tenantSlug);

  return (
    <OverviewClient tenantSlug={tenantSlug} dashboardData={dashboardData} />
  );
}
