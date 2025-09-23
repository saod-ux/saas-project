import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upgradeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug is required" }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { 
        id: true,
        name: true,
        settingsJson: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Upgrade settings to latest version
    const upgradedSettings = upgradeSettings(tenant.settingsJson || {});

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
