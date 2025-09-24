import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, deleteDocument, updateDocument } from "@/lib/firebase/tenant";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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
    const imageToDelete = productImages.find((img: any) => img.id === params.imageId);
    if (!imageToDelete) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const wasPrimary = imageToDelete.isPrimary;

    // Delete the image
    await deleteDocument('productImages', params.imageId);

    // If deleted image was primary, promote the next image by lowest sortOrder
    if (wasPrimary) {
      const remainingImages = productImages.filter((img: any) => img.id !== params.imageId);
      if (remainingImages.length > 0) {
        const nextImage = remainingImages.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))[0];
        if (nextImage) {
          await updateDocument('productImages', nextImage.id, { isPrimary: true });
        }
      }
    }

    return NextResponse.json({ ok: true, deletedId: params.imageId });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete image" },
      { status: 500 }
    );
  }
}
