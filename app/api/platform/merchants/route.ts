import { NextRequest, NextResponse } from "next/server";
import { createTenant } from "@/lib/firebase/tenant";
import { getTenantBySlug } from "@/lib/services/tenant";
import { createTenantCategory } from "@/lib/firebase/tenant";
import { requirePlatformRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since we don't have a way to get all tenants yet
    // In a real app, you'd implement getAllTenants in the Firebase tenant module
    const merchants: any[] = [];

    return NextResponse.json({
      ok: true,
      data: merchants
    });

  } catch (error) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const authResult = await requirePlatformRole(request, 'SUPER_ADMIN');
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }

    const body = await request.json();
    const { 
      storeName, 
      storeSlug, 
      ownerEmail, 
      ownerName, 
      template = 'RETAIL',
      name, // fallback for direct API calls
      email, // fallback for direct API calls
      slug // fallback for direct API calls
    } = body;

    // Use the frontend field names or fallback to direct API field names
    const merchantName = storeName || name;
    const merchantEmail = ownerEmail || email;
    const merchantSlug = storeSlug || slug;

    if (!merchantName || !merchantEmail) {
      return NextResponse.json(
        { error: 'Store name and owner email are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const tenantSlug = merchantSlug || merchantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Check if slug already exists
    const existingTenant = await getTenantBySlug(tenantSlug);
    if (existingTenant) {
      return NextResponse.json(
        { error: 'A merchant with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the merchant (tenant)
    const merchant = await createTenant({
      id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: merchantName,
      slug: tenantSlug,
      status: 'ACTIVE',
      template: template,
      settingsJson: JSON.stringify({
        theme: 'default',
        currency: 'USD',
        language: 'en',
        email: merchantEmail,
        ownerName: ownerName || merchantName
      })
    });

    // Create default categories with Arabic support
    const categories = [
      { 
        name: "Featured", 
        nameAr: "مميز", 
        slug: "featured", 
        sortOrder: 1 
      },
      { 
        name: "New Arrivals", 
        nameAr: "وصل حديثاً", 
        slug: "new-arrivals", 
        sortOrder: 2 
      },
      { 
        name: "Best Sellers", 
        nameAr: "الأكثر مبيعاً", 
        slug: "best-sellers", 
        sortOrder: 3 
      }
    ];

    for (const cat of categories) {
      await createTenantCategory(merchant.id, {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cat.name,
        nameAr: cat.nameAr,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
        imageUrl: null // Will be set when admin uploads an image
      });
    }

    return NextResponse.json({
      ok: true,
      data: merchant
    });

  } catch (error) {
    console.error('Error creating merchant:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}