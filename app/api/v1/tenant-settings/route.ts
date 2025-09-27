import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/services/tenant";
import { upgradeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug is required" }, { status: 400 });
  }

  try {
    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Upgrade settings to latest version
    const upgradedSettings = upgradeSettings(tenant.settings || {});

    return NextResponse.json({
      found: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        settings: upgradedSettings,
      },
    });
  } catch (error) {
    console.error("Error fetching tenant settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
