import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAndRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const user = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"]);
    
    const body = await request.json();
    const { slides } = body;

    if (!Array.isArray(slides)) {
      return NextResponse.json({ ok: false, error: "Invalid slides data" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ 
      where: { slug: params.tenantSlug }, 
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    // Delete all existing slides and recreate in order
    await prisma.$transaction(async (tx) => {
      await tx.heroSlide.deleteMany({ where: { tenantId: tenant.id } });
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await tx.heroSlide.create({
          data: {
            tenantId: tenant.id,
            url: slide.url,
            type: slide.type ?? "image",
            poster: slide.poster ?? null,
            sortOrder: i,
            isActive: slide.isActive ?? true,
          },
        });
      }
    });

    // Invalidate the Home page for this tenant
    revalidatePath(`/${params.tenantSlug}`);

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error("Error updating hero slides:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update hero slides" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const user = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"]);
    
    const tenant = await prisma.tenant.findUnique({ 
      where: { slug: params.tenantSlug },
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    const slides = await prisma.heroSlide.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        url: true,
        type: true,
        poster: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ ok: true, slides });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch hero slides" },
      { status: 500 }
    );
  }
}
