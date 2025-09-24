import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantDocuments, updateDocument } from "@/lib/firebase/tenant";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";

const UpdateCategoryImageSchema = z.object({
  imageUrl: z.string().url().nullable()
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
    const { imageUrl } = UpdateCategoryImageSchema.parse(body);

    // Check if category exists and belongs to tenant
    const categories = await getTenantDocuments('categories', tenant.id);
    const category = categories.find((c: any) => c.id === params.id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Update category image
    const updated = await updateDocument('categories', params.id, { 
      imageUrl,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      ok: true,
      data: {
        id: updated.id,
        imageUrl: imageUrl
      }
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
