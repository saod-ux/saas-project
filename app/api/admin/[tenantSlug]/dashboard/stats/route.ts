import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Get tenant by slug
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }
    
    // For now, return mock data since orders and products aren't fully implemented
    const response = {
      totals: {
        products: 0,
        ordersToday: 0,
        ordersThisWeek: 0,
        revenueThisWeek: 0
      },
      deltas: {
        productsPct: 0,
        ordersPct: 0,
        revenuePct: 0
      }
    };

    return NextResponse.json({ ok: true, data: response }, { 
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}


