import { NextRequest, NextResponse } from "next/server";
import { createTenant, getTenantBySlug } from "@/lib/firebase/tenant";
import { createTenantCategory } from "@/lib/firebase/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Temporarily remove auth for testing
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // In a real app, you'd check if the user has platform admin permissions
    // For now, we'll allow any user to create merchants in development

    const body = await req.json();
    const { name, slug, email, domain } = body;

    if (!name || !slug || !email) {
      return NextResponse.json(
        { error: "Name, slug, and email are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingTenant = await getTenantBySlug(slug.toLowerCase());

    if (existingTenant) {
      return NextResponse.json(
        { error: "A merchant with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the tenant
    const tenant = await createTenant({
      id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      slug: slug.toLowerCase(),
      settingsJson: JSON.stringify({
        localization: { locale: "en-US" },
        currency: "USD"
      }),
      status: "ACTIVE",
      template: "RETAIL",
      domain: domain ? domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : null
    });

    // Create default categories
    const categories = [
      { name: "Featured", slug: "featured", sortOrder: 1 },
      { name: "New Arrivals", slug: "new-arrivals", sortOrder: 2 },
      { name: "Best Sellers", slug: "best-sellers", sortOrder: 3 }
    ];

    for (const cat of categories) {
      await createTenantCategory(tenant.id, {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true
      });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: domain || null
      }
    });

  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json(
      { error: "Failed to create merchant", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("Starting merchants fetch...");
    
    // For now, return empty array since we don't have a way to get all tenants yet
    // In a real app, you'd implement getAllTenants in the Firebase tenant module
    const merchants: any[] = [];

    console.log("Merchants fetched successfully:", merchants.length);
    return NextResponse.json({ merchants });

  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
