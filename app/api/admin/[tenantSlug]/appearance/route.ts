import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments, createDocument, deleteDocument } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerDb } from "@/lib/firebase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AppearancePayload = {
  logoUrl: string | null;
  heroImages: string[];      // carousel images
  heroVideoUrl: string | null;
};

function normalizeAppearance(tenant: any, heroSlides: any[]): AppearancePayload {
  const logoUrl = tenant?.logoUrl ?? null;

  // Extract hero images from heroSlides
  const heroImagesArray: string[] = heroSlides
    ?.filter((slide: any) => slide.type === 'image' && slide.url && slide.isActive)
    .map((slide: any) => slide.url) || [];

  // Get first video URL from heroSlides
  const heroVideoUrl = heroSlides
    ?.find((slide: any) => slide.type === 'video' && slide.url && slide.isActive)?.url ?? null;

  return {
    logoUrl,
    heroImages: heroImagesArray,
    heroVideoUrl,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Get tenant by slug
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      const empty: AppearancePayload = { logoUrl: null, heroImages: [], heroVideoUrl: null };
      return NextResponse.json({ ok: true, appearance: empty }, { status: 200 });
    }
    
    // Get hero slides for this tenant
    const heroSlides = await getTenantDocuments('heroSlides', tenant.id);
    const sortedSlides = heroSlides.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const appearance = normalizeAppearance(tenant, sortedSlides);
    return NextResponse.json({ ok: true, appearance }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error("Error fetching appearance:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch appearance settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Resolve tenant by slug consistently with GET behavior
    const db = await getServerDb();
    let tenantId: string;
    const existing = await getTenantBySlug(params.tenantSlug);
    if (existing) {
      tenantId = existing.id;
    } else {
      // Lazily create if not found
      const docRef = db.collection('tenants').doc();
      await docRef.set({
        slug: params.tenantSlug,
        name: params.tenantSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      tenantId = docRef.id;
    }

    const body = await request.json();
    const hasSlides = Object.prototype.hasOwnProperty.call(body, 'slides') || Object.prototype.hasOwnProperty.call(body, 'heroImages');
    // Support either full slide objects or plain heroImages URLs
    let slides = [] as any[];
    if (Object.prototype.hasOwnProperty.call(body, 'slides')) {
      slides = body.slides || [];
    } else if (Object.prototype.hasOwnProperty.call(body, 'heroImages')) {
      const heroImages = Array.isArray(body.heroImages) ? body.heroImages : [];
      slides = heroImages.map((url: string, index: number) => ({ type: 'image', url, sortOrder: index }));
    }
    if (hasSlides) {
      if (!Array.isArray(slides)) {
        return NextResponse.json({ ok: false, error: "Slides must be an array" }, { status: 400 });
      }
      for (const slide of slides) {
        if (!slide.type || !slide.url || typeof slide.sortOrder !== 'number') {
          return NextResponse.json({ 
            ok: false, 
            error: "Each slide must have type, url, and sortOrder" 
          }, { status: 400 });
        }
        if (!['image', 'video'].includes(slide.type)) {
          return NextResponse.json({ 
            ok: false, 
            error: "Slide type must be 'image' or 'video'" 
          }, { status: 400 });
        }
      }
    }

    // Upsert tenant fields; only touch logoUrl if provided to avoid clearing it
    const updateData: any = { updatedAt: new Date() };
    if (Object.prototype.hasOwnProperty.call(body, 'logoUrl')) {
      updateData.logoUrl = body.logoUrl ?? null;
    }
    await db.collection('tenants').doc(tenantId).set(updateData, { merge: true });

    // If slides are provided, replace them; otherwise keep existing ones
    if (hasSlides) {
      const existingSlides = await getTenantDocuments('heroSlides', tenantId);
      for (const slide of existingSlides) {
        await deleteDocument('heroSlides', slide.id);
      }
      if (slides.length > 0) {
        for (const slide of slides) {
          await createDocument('heroSlides', {
            tenantId: tenantId,
            url: slide.url,
            type: slide.type,
            sortOrder: slide.sortOrder,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Invalidate pages
    revalidatePath(`/${params.tenantSlug}`, "page");
    revalidatePath(`/${params.tenantSlug}/retail`, "page");

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error("Error updating appearance:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}