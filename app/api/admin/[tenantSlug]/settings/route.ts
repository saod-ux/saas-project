import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SocialLinksSchema = z.object({
  instagram: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  snapchat: z.string().url().optional(),
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  whatsapp: z.string().optional(),
});

const SettingsSchema = z.object({
  social: SocialLinksSchema.optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    console.log('GET settings for tenant:', params.tenantSlug);
    
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    // Get settings from tenant document
    const settings = tenant.settings || {};
    
    console.log('Retrieved settings:', { tenantSlug: params.tenantSlug, settings });
    
    return NextResponse.json({ 
      ok: true, 
      settings 
    }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ ok: false, error: "Failed to fetch settings" }, { status: 500 });
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

    console.log('PUT settings for tenant:', params.tenantSlug, 'payload:', body);

    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.flatten());
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { social } = parsed.data;

    // Get or create tenant
    const tenant = await getTenantBySlug(params.tenantSlug);
    let tenantId: string;
    
    if (tenant) {
      tenantId = tenant.id;
    } else {
      const docRef = db.collection('tenants').doc();
      await docRef.set({ 
        slug: params.tenantSlug, 
        name: params.tenantSlug, 
        createdAt: new Date() 
      }, { merge: true });
      tenantId = docRef.id;
    }

    // Update settings
    const updateData: any = { 
      updatedAt: new Date() 
    };

    if (social) {
      updateData['settings.social'] = social;
    }

    await db.collection('tenants').doc(tenantId).set(updateData, { merge: true });

    console.log('Settings updated successfully:', { 
      tenantSlug: params.tenantSlug, 
      tenantId, 
      durationMs: Date.now() - startedAt 
    });

    revalidatePath(`/admin/${params.tenantSlug}/settings`, "page");
    
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ ok: false, error: "Failed to update settings" }, { status: 500 });
  }
}