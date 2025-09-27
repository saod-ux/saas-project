import { getTenantBySlug } from "@/lib/services/tenant";
import { upgradeSettings } from "@/lib/settings";

export type LoadedTenant = { 
  id: string; 
  slug: string; 
  name: string; 
  logoUrl?: string | null; 
  heroImageUrl?: string | null; 
  heroVideoUrl?: string | null; 
  settingsJson?: any;
  domain?: string | null;
  settings?: any;
};

export async function loadTenantBySlug(slug: string): Promise<LoadedTenant | null> {
  if (!slug) return null;
  
  try {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return null;
    
    // Parse and upgrade settings
    const settings = upgradeSettings(tenant.settingsJson || {});
    
    return {
      ...tenant,
      settings
    };
  } catch (error) {
    console.error('Error loading tenant:', error);
    return null;
  }
}