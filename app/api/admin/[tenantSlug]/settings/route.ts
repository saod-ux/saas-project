import { NextRequest } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/services/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ok, badRequest, notFound, errorResponse } from "@/lib/http/responses";
import { logger, createRequestContext } from "@/lib/logging";
import { withApiRateLimit } from "@/lib/rate-limiting";
import { withApiSecurityHeaders } from "@/lib/security/headers";
import { sanitizeUrl, sanitizeRichText, isValidUrl } from "@/lib/security/sanitization";
import { caches, cacheKeys, getCachedOrFetch } from "@/lib/performance/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SocialLinksSchema = z.object({
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  snapchat: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
});

const SettingsSchema = z.object({
  social: SocialLinksSchema.optional(),
});

export const GET = withApiSecurityHeaders(withApiRateLimit(async function(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const context = createRequestContext(request);
  
  try {
    logger.info('GET settings for tenant', { ...context, tenantSlug: params.tenantSlug });
    
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      logger.warn('Tenant not found', { ...context, tenantSlug: params.tenantSlug });
      return notFound("Tenant not found");
    }

    // Get settings from tenant document
    // Handle both nested settings object and flat settings.social field
    let settings = tenant.settings || {};
    
    // If settings.social exists as a flat field, extract it
    if (tenant['settings.social']) {
      settings = {
        ...settings,
        social: tenant['settings.social']
      };
    }
    
    logger.info('Retrieved settings', { 
      ...context, 
      tenantSlug: params.tenantSlug, 
      tenantId: tenant.id,
      hasSettings: Object.keys(settings).length > 0
    });
    
    return ok(settings);
  } catch (error) {
    logger.error('Error fetching settings', context, error instanceof Error ? error : new Error(String(error)));
    return errorResponse("Failed to fetch settings");
  }
}));

export const PUT = withApiSecurityHeaders(withApiRateLimit(async function(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const context = createRequestContext(request);
  const startedAt = Date.now();
  
  try {
    const db = await getServerDb();
    const body = await request.json();

    // Sanitize social media URLs
    if (body.social) {
      const sanitizedSocial: any = {};
      for (const [platform, url] of Object.entries(body.social)) {
        if (typeof url === 'string' && url.trim()) {
          const sanitizedUrl = sanitizeUrl(url);
          if (isValidUrl(sanitizedUrl)) {
            sanitizedSocial[platform] = sanitizedUrl;
          }
        }
      }
      body.social = sanitizedSocial;
    }

    logger.info('PUT settings for tenant', { 
      ...context, 
      tenantSlug: params.tenantSlug,
      payloadSize: JSON.stringify(body).length
    });

    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('Settings validation failed', { 
        ...context, 
        tenantSlug: params.tenantSlug,
        validationErrors: parsed.error.flatten()
      });
      return badRequest(parsed.error.flatten());
    }

    const { social } = parsed.data;

    // Get or create tenant
    const tenant = await getTenantBySlug(params.tenantSlug);
    let tenantId: string;
    
    if (tenant) {
      tenantId = tenant.id;
      logger.info('Using existing tenant', { ...context, tenantId, tenantSlug: params.tenantSlug });
    } else {
      const docRef = db.collection('tenants').doc();
      await docRef.set({ 
        slug: params.tenantSlug, 
        name: params.tenantSlug, 
        createdAt: new Date() 
      }, { merge: true });
      tenantId = docRef.id;
      logger.info('Created new tenant', { ...context, tenantId, tenantSlug: params.tenantSlug });
    }

    // Update settings
    const updateData: any = { 
      updatedAt: new Date() 
    };

    if (social) {
      updateData['settings.social'] = social;
    }

    await db.collection('tenants').doc(tenantId).set(updateData, { merge: true });

    // Invalidate related caches
    caches.tenant.delete(cacheKeys.tenant(params.tenantSlug));
    caches.tenant.delete(cacheKeys.tenantById(tenantId));
    caches.settings.delete(cacheKeys.settings(tenantId));

    const duration = Date.now() - startedAt;
    logger.info('Settings updated successfully', { 
      ...context, 
      tenantSlug: params.tenantSlug, 
      tenantId,
      duration,
      hasSocialLinks: !!social
    });

    revalidatePath(`/admin/${params.tenantSlug}/settings`, "page");
    
    return ok(true);
  } catch (error) {
    const duration = Date.now() - startedAt;
    logger.error('Error updating settings', { ...context, duration }, error instanceof Error ? error : new Error(String(error)));
    return errorResponse("Failed to update settings");
  }
}));