import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AddImagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().url(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).min(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    const body = await request.json();
    const { images } = AddImagesSchema.parse(body);

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

    const hasPrimary = product.productImages.some((img: any) => img.isPrimary);

    // Create images in transaction
    const createdImages = await prisma.$transaction(async (tx) => {
      // Get the highest sort order
      const maxOrder = await tx.productImage.aggregate({
        where: { productId: product.id },
        _max: { order: true }
      });

      const baseOrder = maxOrder._max.order ?? -1;

      // Create all images
      const createdImgs = await Promise.all(
        images.map((img, idx) => 
          tx.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              order: baseOrder + idx + 1,
              isPrimary: !hasPrimary && idx === 0, // Auto-primary if none exists
            }
          })
        )
      );

      return createdImgs;
    });

    return NextResponse.json({ images: createdImages });
  } catch (error) {
    console.error("Error adding product images:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add images" },
      { status: 500 }
    );
  }
}
