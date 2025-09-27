import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/services/tenant";
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
    const logo = tenant?.logo ?? null;
    console.log(JSON.stringify({
      level: 'info', route: '/api/admin/[slug]/logo', method: 'GET', tenantSlug: params.tenantSlug,
      tenantId: tenant?.id ?? null, status: 200, durationMs: Date.now() - startedAt
    }));
    return NextResponse.json({ ok: true, logo }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error', route: '/api/admin/[slug]/logo', method: 'GET', tenantSlug: params.tenantSlug,
      error: (error as Error).message, status: 500
    }));
    return NextResponse.json({ ok: false, error: "Failed to fetch logo" }, { status: 500 });
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

    const LogoSchema = z.object({
      logo: z.object({
        url: z.string().url(),
        width: z.number().min(0),
        height: z.number().min(0),
        alt: z.string()
      }).nullable(),
    });
    const parsed = LogoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { logo } = parsed.data;

    // Resolve tenant
    const existing = await getTenantBySlug(params.tenantSlug);
    let tenantId: string;
    if (existing) {
      tenantId = existing.id;
    } else {
      const docRef = db.collection('tenants').doc();
      await docRef.set({ slug: params.tenantSlug, name: params.tenantSlug, createdAt: new Date() }, { merge: true });
      tenantId = docRef.id;
    }

    await db.collection('tenants').doc(tenantId).set({ logo, updatedAt: new Date() }, { merge: true });

    revalidatePath(`/${params.tenantSlug}`, "page");
    revalidatePath(`/${params.tenantSlug}/retail`, "page");
    revalidatePath(`/admin/${params.tenantSlug}/appearance`, "page");
    console.log(JSON.stringify({
      level: 'info', route: '/api/admin/[slug]/logo', method: 'PUT', tenantSlug: params.tenantSlug,
      tenantId, status: 200, durationMs: Date.now() - startedAt
    }));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error', route: '/api/admin/[slug]/logo', method: 'PUT', tenantSlug: params.tenantSlug,
      error: (error as Error).message, status: 500
    }));
    return NextResponse.json({ ok: false, error: "Failed to update logo" }, { status: 500 });
  }
}


