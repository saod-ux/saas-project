import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments } from "@/lib/firebase/tenant";
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
    const allProducts = await getTenantDocuments('products', tenant.id);
    const lowStockProducts = allProducts
      .filter((product: any) => 
        product.status === "active" && 
        product.stock <= 5
      )
      .sort((a: any, b: any) => a.stock - b.stock)
      .map((product: any) => ({
        id: product.id,
        title: product.title,
        stock: product.stock,
        imageUrl: product.imageUrl
      }));

    // Add lowStockThreshold field with default value
    const productsWithThreshold = lowStockProducts.map((product: any) => ({
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
