import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const product = await prisma.product.findFirst({
      where: { 
        id: params.id, 
        tenantId: tenant.id 
      },
      include: { productImages: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if image exists and belongs to this product
    const imageToDelete = product.productImages.find((img: any) => img.id === params.imageId);
    if (!imageToDelete) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const wasPrimary = imageToDelete.isPrimary;

    // Delete the image
    const deleted = await prisma.productImage.delete({
      where: { id: params.imageId }
    });

    // If deleted image was primary, promote the next image by lowest sortOrder
    if (wasPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: product.id },
        orderBy: { order: "asc" }
      });

      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true }
        });
      }
    }

    return NextResponse.json({ ok: true, deletedId: deleted.id });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete image" },
      { status: 500 }
    );
  }
}
