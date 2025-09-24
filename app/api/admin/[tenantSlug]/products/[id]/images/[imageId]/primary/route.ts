import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, updateDocument } from "@/lib/firebase/tenant";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string; imageId: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;

    // Check if product exists and belongs to tenant
    const allProducts = await getTenantDocuments('products', tenant.id);
    const product = allProducts.find((p: any) => p.id === params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get all product images for this product
    const allProductImages = await getTenantDocuments('productImages', tenant.id);
    const productImages = allProductImages.filter((img: any) => img.productId === params.id);

    // Check if image exists and belongs to this product
    const image = productImages.find((img: any) => img.id === params.imageId);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Update primary status - remove primary from all images first
    for (const img of productImages) {
      await updateDocument('productImages', img.id, { isPrimary: false });
    }

    // Set this image as primary
    await updateDocument('productImages', params.imageId, { isPrimary: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error setting primary image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set primary image" },
      { status: 500 }
    );
  }
}
