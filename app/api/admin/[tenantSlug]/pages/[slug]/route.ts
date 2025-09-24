import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/firebase/tenant";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";
import { z } from "zod";

const UpdatePageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  isPublished: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; slug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    const allPages = await getTenantDocuments('pages', tenant.id);
    const page = allPages.find((p: any) => p.slug === params.slug);

    if (!page) {
      return NextResponse.json(
        { ok: false, error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; slug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    const body = await request.json();
    const validatedData = UpdatePageSchema.parse(body);

    // Check if page exists
    const allPages = await getTenantDocuments('pages', tenant.id);
    const existingPage = allPages.find((p: any) => p.slug === params.slug);

    let page;
    if (existingPage) {
      // Update existing page
      page = await updateDocument('pages', existingPage.id, validatedData);
    } else {
      // Create new page
      page = await createDocument('pages', { 
        ...validatedData, 
        slug: params.slug, 
        tenantId: tenant.id 
      });
    }

    return NextResponse.json({ ok: true, data: page });
  } catch (error) {
    console.error("Error updating page:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; slug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    // Check if page exists and belongs to tenant
    const allPages = await getTenantDocuments('pages', tenant.id);
    const existingPage = allPages.find((p: any) => p.slug === params.slug);

    if (!existingPage) {
      return NextResponse.json(
        { ok: false, error: "Page not found" },
        { status: 404 }
      );
    }

    // Delete page
    await deleteDocument('pages', existingPage.id);

    return NextResponse.json({ ok: true, message: "Page deleted successfully" });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete page" },
      { status: 500 }
    );
  }
}
