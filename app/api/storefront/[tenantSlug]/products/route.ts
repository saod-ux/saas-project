import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/services/tenant";
import { getAllDocuments, getTenantDocuments, COLLECTIONS } from "@/lib/firebase/db";
import { ok, notFound, errorResponse } from '@/lib/http/responses';
import { withPublicCors, CorsConfig } from '@/lib/security/cors';
import { caches, cacheKeys, getCachedOrFetch } from '@/lib/performance/cache';

export const runtime = "nodejs";

// Custom CORS configuration for storefront products
const storefrontCorsConfig: CorsConfig = {
  origin: async (origin: string) => {
    // Allow same-origin requests
    if (!origin) return true;
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return true;
    }
    
    // For production, we'll implement domain verification
    // This is a simplified version - in production you'd check against verified domains
    return true; // Allow all origins for now, but this should be restricted
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
};

// Check if origin is allowed for CORS
async function isOriginAllowed(origin: string, tenantSlug: string): Promise<boolean> {
  try {
    // Get tenant settings to check CORS policy
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant?.settingsJson) return false;

    const settings = JSON.parse(tenant.settingsJson);
    if (!settings.media?.allowPublicApiFromCustomDomain) return false;

    // Check if origin matches a verified custom domain
    const domains = await getTenantDocuments(COLLECTIONS.DOMAINS, tenant.id);
    const domain = domains.find((d: any) => 
      d.domain === origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '') && 
      d.verified === true
    );

    return !!domain;
  } catch (error) {
    console.error("Error checking CORS origin:", error);
    return false;
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  
  // Apply CORS headers
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const origin = request.headers.get('origin');
    
    // Check CORS if origin is provided
    if (origin && origin !== request.nextUrl.origin) {
      const isAllowed = await isOriginAllowed(origin, params.tenantSlug);
      if (!isAllowed) {
        return NextResponse.json({ error: "CORS not allowed" }, { status: 403 });
      }
    }

    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      return notFound("Tenant not found");
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get all products for the tenant (with caching)
    const cacheKey = cacheKeys.products(tenant.id, categoryId || undefined);
    const allProducts = await getCachedOrFetch(
      caches.products,
      cacheKey,
      () => getTenantDocuments(COLLECTIONS.PRODUCTS, tenant.id)
    );
    
    // Filter active products
    let products = allProducts.filter((product: any) => product.status === "active");

    // Filter by category if specified
    if (categoryId) {
      products = products.filter((product: any) => product.primaryCategoryId === categoryId);
    }

    // Sort products
    products = products.sort((a: any, b: any) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      if (a.isNewArrival && !b.isNewArrival) return -1;
      if (!a.isNewArrival && b.isNewArrival) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    products = products.slice(offset, offset + limit);

    // Add computed primaryImageUrl field and tenant logo for fallback
    const productsWithImages = products.map((product: any) => ({
      ...product,
      primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]) || null,
      tenantLogoUrl: tenant.logoUrl,
    }));

    const response = ok({
      products: productsWithImages,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
      }
    });

    // Apply CORS headers
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  } catch (error) {
    console.error("Error fetching storefront products:", error);
    const response = errorResponse(error instanceof Error ? error.message : "Failed to fetch products");
    
    // Apply CORS headers to error response
    const origin = request.headers.get('origin');
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }
}
