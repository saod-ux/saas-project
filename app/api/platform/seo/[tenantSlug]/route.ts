import { NextRequest, NextResponse } from "next/server";
import { updateTenant } from "@/lib/firebase/tenant";
import { getTenantBySlug } from "@/lib/services/tenant";
import { upgradeSettings } from "@/lib/settings";
import { z } from "zod";

const seoUpdateSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  redirectToCustomDomain: z.boolean().optional(),
  edgeCacheTTL: z.number().min(0).max(3600).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const tenant = await getTenantBySlug(params.tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const settings = upgradeSettings(tenant.settings as any);
    
    return NextResponse.json({
      ok: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        seo: settings.seo,
      }
    });

  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const tenant = await getTenantBySlug(params.tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = seoUpdateSchema.parse(body);

    // Get current settings and upgrade them
    const currentSettings = upgradeSettings(tenant.settings as any);
    
    // Update SEO settings
    const updatedSettings = {
      ...currentSettings,
      seo: {
        ...currentSettings.seo,
        ...validatedData,
      }
    };

    // Save updated settings
    await updateTenant(tenant.id, {
      settings: updatedSettings,
    });

    return NextResponse.json({
      ok: true,
      data: updatedSettings.seo,
      message: "SEO settings updated successfully"
    });

  } catch (error) {
    console.error("Error updating SEO settings:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




