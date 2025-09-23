import { NextResponse } from "next/server";
import { getTenantBySlug, updateTenant } from "@/lib/firebase/tenant";
import { upgradeSettings } from "@/lib/settings";

export async function GET(_: Request, { params }: { params: { tenantSlug: string }}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) return NextResponse.json({ ok:false, error:"Tenant not found" }, { status:404 });

  const settings = tenant.settingsJson as any || {};
  const upgradedSettings = upgradeSettings(settings);
  
  const data = {
    language: upgradedSettings.storefront?.localization?.locale?.split('-')[0] ?? "ar",
    currency: settings.currency ?? "KWD",
    instagramUrl: upgradedSettings.social?.instagram ?? "",
    whatsappUrl: upgradedSettings.social?.whatsapp ?? "",
    tiktokUrl: upgradedSettings.social?.tiktok ?? "",
    snapchatUrl: upgradedSettings.social?.snapchat ?? "",
  };
  
  // Fallback to raw settingsJson if upgradeSettings doesn't work
  if (!data.snapchatUrl && settings.social?.snapchat) {
    data.snapchatUrl = settings.social.snapchat;
  }
  
  
  return NextResponse.json({ ok:true, data });
}

export async function PUT(req: Request, { params }: { params: { tenantSlug: string }}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) return NextResponse.json({ ok:false, error:"Tenant not found" }, { status:404 });

  const body = await req.json();
  
  // Get current settings and merge with new data
  const currentSettings = tenant.settingsJson as any || {};
  
  // Create a new settings object that includes the old format URLs for migration
  const settingsToMigrate = {
    ...currentSettings,
    // Add the old format URLs at root level for migration
    instagramUrl: body.instagramUrl,
    whatsappUrl: body.whatsappUrl,
    tiktokUrl: body.tiktokUrl,
    snapchatUrl: body.snapchatUrl,
    // Keep other settings
    language: body.language || currentSettings.language,
    currency: body.currency || currentSettings.currency,
  };
  
  // Also ensure the social object exists and has all social media fields
  if (!settingsToMigrate.social) {
    settingsToMigrate.social = {};
  }
  
  // Ensure all social media URLs are preserved in the social object
  // Use !== undefined to allow empty strings to clear the values
  if (body.instagramUrl !== undefined) {
    settingsToMigrate.social.instagram = body.instagramUrl;
  }
  if (body.whatsappUrl !== undefined) {
    settingsToMigrate.social.whatsapp = body.whatsappUrl;
  }
  if (body.tiktokUrl !== undefined) {
    settingsToMigrate.social.tiktok = body.tiktokUrl;
  }
  if (body.snapchatUrl !== undefined) {
    settingsToMigrate.social.snapchat = body.snapchatUrl;
  }
  
  // Upgrade the settings to ensure proper structure
  const upgradedSettings = upgradeSettings(settingsToMigrate);
  
  // Ensure snapchat is preserved after upgrade
  if (body.snapchatUrl) {
    upgradedSettings.social.snapchat = body.snapchatUrl;
  }
  
  await updateTenant(tenant.id, {
    settingsJson: upgradedSettings
  });

  return NextResponse.json({ ok:true, data: body });
}
