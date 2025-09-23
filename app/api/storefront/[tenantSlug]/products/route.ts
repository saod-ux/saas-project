import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getAllDocuments, getTenantDocuments, COLLECTIONS } from "@/lib/firebase/db";

export const runtime = "nodejs";

// CORS helper function
function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

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
  return addCorsHeaders(response, origin);
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
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get all products for the tenant
    const allProducts = await getTenantDocuments(COLLECTIONS.PRODUCTS, tenant.id);
    
    // Filter active products
    let products = allProducts.filter((product: any) => product.status === "ACTIVE");

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

    const response = NextResponse.json({ 
      ok: true, 
      data: productsWithImages,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
      }
    });

    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error("Error fetching storefront products:", error);
    const response = NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}
