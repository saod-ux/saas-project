import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ReorderSchema = z.object({
  order: z.array(z.string().cuid()).min(1)
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    const body = await request.json();
    const { order } = ReorderSchema.parse(body);

    // Check if product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: { 
        id: params.id, 
        tenantId: tenant.id 
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update sort order for all images in transaction
    await prisma.$transaction(
      order.map((imageId, index) =>
        prisma.productImage.update({
          where: { id: imageId },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error reordering product images:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder images" },
      { status: 500 }
    );
  }
}
