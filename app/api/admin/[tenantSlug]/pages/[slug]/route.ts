import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    
    const page = await prisma.page.findFirst({
      where: { 
        slug: params.slug,
        tenantId: tenant.id,
      },
    });

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

    const page = await prisma.page.upsert({
      where: { 
        tenantId_slug: { 
          tenantId: tenant.id, 
          slug: params.slug 
        }
      },
      update: validatedData,
      create: { 
        ...validatedData, 
        slug: params.slug, 
        tenantId: tenant.id 
      },
    });

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
    const existingPage = await prisma.page.findFirst({
      where: { 
        slug: params.slug,
        tenantId: tenant.id,
      },
    });

    if (!existingPage) {
      return NextResponse.json(
        { ok: false, error: "Page not found" },
        { status: 404 }
      );
    }

    // Delete page
    await prisma.page.delete({
      where: { id: existingPage.id },
    });

    return NextResponse.json({ ok: true, message: "Page deleted successfully" });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete page" },
      { status: 500 }
    );
  }
}
