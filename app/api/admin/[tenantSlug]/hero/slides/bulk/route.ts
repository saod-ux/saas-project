import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, createDocument, deleteDocument, getTenantBySlug } from "@/lib/firebase/tenant";
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

    const tenant = await getTenantBySlug(params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    // Delete all existing slides and recreate in order
    const existingSlides = await getTenantDocuments('heroSlides', tenant.id);
    for (const slide of existingSlides) {
      await deleteDocument('heroSlides', slide.id);
    }
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      await createDocument('heroSlides', {
        tenantId: tenant.id,
        url: slide.url,
        type: slide.type ?? "image",
        poster: slide.poster ?? null,
        sortOrder: i,
        isActive: slide.isActive ?? true,
        width: slide.width ?? 0,
        height: slide.height ?? 0,
        alt: slide.alt ?? '',
      });
    }

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
    
    const tenant = await getTenantBySlug(params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    const slides = await getTenantDocuments('heroSlides', tenant.id);
    const sortedSlides = slides
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((slide: any) => ({
        id: slide.id,
        url: slide.url,
        type: slide.type,
        poster: slide.poster,
        sortOrder: slide.sortOrder,
        isActive: slide.isActive,
        width: slide.width ?? 0,
        height: slide.height ?? 0,
        alt: slide.alt ?? '',
        updatedAt: slide.updatedAt,
      }));
    
    return NextResponse.json({ ok: true, slides: sortedSlides });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch hero slides" },
      { status: 500 }
    );
  }
}
