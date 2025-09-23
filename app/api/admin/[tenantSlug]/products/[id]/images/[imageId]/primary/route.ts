import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const image = product.productImages.find((img: any) => img.id === params.imageId);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Update primary status in transaction
    await prisma.$transaction([
      // Remove primary from all images
      prisma.productImage.updateMany({
        where: { productId: product.id },
        data: { isPrimary: false }
      }),
      // Set this image as primary
      prisma.productImage.update({
        where: { id: params.imageId },
        data: { isPrimary: true }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error setting primary image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set primary image" },
      { status: 500 }
    );
  }
}
