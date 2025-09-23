import { NextRequest, NextResponse } from "next/server";
import { prismaRW } from "@/lib/db";
import { loadTenantBySlug } from "@/lib/loadTenant";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; categoryId: string } }
) {
  try {
    const { tenantSlug, categoryId } = params;

    // Load tenant
    const tenant = await loadTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    // Fetch products for the category
    const products = await prismaRW.product.findMany({
      where: {
        tenantId: tenant.id,
        primaryCategoryId: categoryId,
        status: "ACTIVE", // Use status field instead of isActive
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        imageUrl: true,
        gallery: true, // Use gallery field instead of primaryImageUrl
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to 20 products for performance
    });

    return NextResponse.json({
      ok: true,
      products: products.map(product => ({
        ...product,
        price: Number(product.price),
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
