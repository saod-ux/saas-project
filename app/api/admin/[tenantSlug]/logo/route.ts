import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const tenant = await getTenantBySlug(params.tenantSlug);
    const logoUrl = tenant?.logoUrl ?? null;
    return NextResponse.json({ ok: true, logoUrl }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch logo" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const db = await getServerDb();
    const body = await request.json();

    const LogoSchema = z.object({
      logoUrl: z.string().url().nullable(),
    });
    const parsed = LogoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { logoUrl } = parsed.data;

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

    await db.collection('tenants').doc(tenantId).set({ logoUrl: logoUrl ?? null, updatedAt: new Date() }, { merge: true });

    revalidatePath(`/${params.tenantSlug}`, "page");
    revalidatePath(`/${params.tenantSlug}/retail`, "page");
    revalidatePath(`/admin/${params.tenantSlug}/appearance`, "page");

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to update logo" }, { status: 500 });
  }
}


