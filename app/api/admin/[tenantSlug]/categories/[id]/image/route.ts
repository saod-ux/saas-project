import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantDocuments, updateDocument } from "@/lib/firebase/tenant";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";

const ImageSchema = z.object({
  url: z.string().url(),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
  alt: z.string().optional(),
});

const UpdateCategoryImageSchema = z.object({
  image: ImageSchema.nullable()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    const body = await request.json();
    const { image } = UpdateCategoryImageSchema.parse(body);

    // Check if category exists and belongs to tenant
    const categories = await getTenantDocuments('categories', tenant.id);
    const category = categories.find((c: any) => c.id === params.id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Update category image (omit when null)
    const updatePayload: any = { updatedAt: new Date() };
    if (image) {
      updatePayload.image = {
        url: image.url,
        width: image.width ?? 0,
        height: image.height ?? 0,
        alt: image.alt ?? '',
      };
    } else {
      updatePayload.image = null;
    }

    const updated = await updateDocument('categories', params.id, updatePayload);

    return NextResponse.json({ 
      ok: true,
      data: { id: updated.id, image: image ?? null }
    });
  } catch (error) {
    console.error("Error updating category image:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category image" },
      { status: 500 }
    );
  }
}
