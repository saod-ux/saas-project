import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug, getTenantDocuments } from "@/lib/firebase/tenant";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; categoryId: string } }
) {
  try {
    const { tenantSlug, categoryId } = params;

    // Load tenant
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    // Fetch products for the category
    const allProducts = await getTenantDocuments('products', tenant.id);
    const products = allProducts
      .filter((product: any) => 
        product.primaryCategoryId === categoryId && 
        product.status === "active"
      )
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20); // Limit to 20 products for performance

    return NextResponse.json({
      ok: true,
      products: products.map((product: any) => ({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        currency: product.currency,
        imageUrl: product.imageUrl,
        gallery: product.gallery,
        createdAt: product.createdAt,
        primaryImageUrl: product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0 
          ? product.gallery[0] 
          : product.imageUrl,
      })),
    });

  } catch (error) {
    console.error("Error fetching category products:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch category products" },
      { status: 500 }
    );
  }
}
