import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const orders = await prisma.order.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        orderNumber: true,
        customerJson: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50) // Cap at 50 for performance
    });

    // Transform orders to include customer info
    const transformedOrders = orders.map(order => {
      const customerJson = order.customerJson as any;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customerJson?.name || order.user?.name || "Guest",
        customerEmail: customerJson?.email || order.user?.email || "",
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt
      };
    });

    return NextResponse.json({ ok: true, data: transformedOrders }, { 
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch recent orders" },
      { status: 500 }
    );
  }
}


