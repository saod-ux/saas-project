import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments, createDocument, deleteDocument } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const startedAt = Date.now();
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) return NextResponse.json({ ok: true, slides: [] });
    const slides = await getTenantDocuments('heroSlides', tenant.id);
    const sorted = slides
      .filter((s: any) => s.isActive !== false)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    console.log(JSON.stringify({
      level: 'info', route: '/api/admin/[slug]/hero/slides', method: 'GET', tenantSlug: params.tenantSlug,
      tenantId: tenant.id, status: 200, durationMs: Date.now() - startedAt
    }));
    return NextResponse.json({ ok: true, slides: sorted }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error', route: '/api/admin/[slug]/hero/slides', method: 'GET', tenantSlug: params.tenantSlug,
      error: (error as Error).message, status: 500
    }));
    return NextResponse.json({ ok: false, error: "Failed to fetch slides" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const startedAt = Date.now();
    const db = await getServerDb();
    const body = await request.json();

    const SlideSchema = z.object({
      type: z.enum(["image", "video"]),
      url: z.string().url(),
      sortOrder: z.number().int().min(0),
      isActive: z.boolean().optional(),
      width: z.number().int().min(0).optional(),
      height: z.number().int().min(0).optional(),
      alt: z.string().optional(),
    });
    const Schema = z.object({ slides: z.array(SlideSchema) });
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const slides = parsed.data.slides;

    const tenant = await getTenantBySlug(params.tenantSlug);
    let tenantId: string;
    if (tenant) {
      tenantId = tenant.id;
    } else {
      const docRef = db.collection('tenants').doc();
      await docRef.set({ slug: params.tenantSlug, name: params.tenantSlug, createdAt: new Date() }, { merge: true });
      tenantId = docRef.id;
    }

    // Replace slides
    const existing = await getTenantDocuments('heroSlides', tenantId);
    for (const s of existing) {
      await deleteDocument('heroSlides', s.id);
    }
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (!s?.url || !s?.type) continue;
      await createDocument('heroSlides', {
        tenantId,
        url: s.url,
        type: s.type === 'video' ? 'video' : 'image',
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : i,
        isActive: s.isActive !== false,
        width: s.width ?? 0,
        height: s.height ?? 0,
        alt: s.alt ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    revalidatePath(`/${params.tenantSlug}`, 'page');
    revalidatePath(`/${params.tenantSlug}/retail`, 'page');
    console.log(JSON.stringify({
      level: 'info', route: '/api/admin/[slug]/hero/slides', method: 'PUT', tenantSlug: params.tenantSlug,
      tenantId, count: slides.length, status: 200, durationMs: Date.now() - startedAt
    }));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error', route: '/api/admin/[slug]/hero/slides', method: 'PUT', tenantSlug: params.tenantSlug,
      error: (error as Error).message, status: 500
    }));
    return NextResponse.json({ ok: false, error: "Failed to update slides" }, { status: 500 });
  }
}


