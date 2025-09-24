import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantDocuments, createDocument } from "@/lib/firebase/tenant";
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
    const allProducts = await getTenantDocuments('products', tenant.id);
    const product = allProducts.find((p: any) => p.id === params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get existing product images
    const allProductImages = await getTenantDocuments('productImages', tenant.id);
    const productImages = allProductImages.filter((img: any) => img.productId === params.id);

    const hasPrimary = productImages.some((img: any) => img.isPrimary);

    // Get the highest sort order
    const maxOrder = productImages.reduce((max: number, img: any) => 
      Math.max(max, img.order || 0), -1
    );

    const baseOrder = maxOrder;

    // Create all images
    const createdImages = await Promise.all(
      images.map((img, idx) => 
        createDocument('productImages', {
          productId: product.id,
          url: img.url,
          order: baseOrder + idx + 1,
          isPrimary: !hasPrimary && idx === 0, // Auto-primary if none exists
        })
      )
    );

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
