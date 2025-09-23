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
    
    // Get products with low stock (using a simple threshold of 5 for now)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        status: "active",
        stock: { lte: 5 } // Simple threshold for now
      },
      select: {
        id: true,
        title: true,
        stock: true,
        imageUrl: true
      },
      orderBy: { stock: "asc" }
    });

    // Add lowStockThreshold field with default value
    const productsWithThreshold = lowStockProducts.map(product => ({
      ...product,
      lowStockThreshold: 5 // Default threshold
    }));

    return NextResponse.json({ ok: true, data: productsWithThreshold }, { 
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch low stock products" },
      { status: 500 }
    );
  }
}
