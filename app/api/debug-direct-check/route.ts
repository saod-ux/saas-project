import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";
import { getTenantBySlug } from "@/lib/firebase/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'demo-store';
    const body = await request.json();
    
    const db = await getServerDb();
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }
    const tenantId = tenant.id;
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    
    console.log("Before update - document data:", tenantDoc.data());
    
    // Update the document directly
    const updateData = {
      logoUrl: body.logoUrl || null,
      heroImages: body.heroImages || [],
      heroVideoUrl: body.heroVideoUrl || null,
      updatedAt: new Date(),
    };
    
    console.log("Updating with data:", updateData);
    
    await db.collection('tenants').doc(tenantId).update(updateData);
    
    console.log("Update completed, fetching document again...");
    
    // Get the document again immediately
    const updatedDoc = await db.collection('tenants').doc(tenantId).get();
    const updatedData = updatedDoc.data();
    
    console.log("After update - document data:", updatedData);
    
    // Also try getting by ID
    const docById = await db.collection('tenants').doc(tenantId).get();
    const dataById = docById.data();
    
    console.log("Document by ID:", dataById);
    
    return NextResponse.json({ 
      ok: true, 
      message: "Direct check completed",
      results: {
        beforeUpdate: tenantDoc.data(),
        updateData: updateData,
        afterUpdate: updatedData,
        byId: dataById,
      }
    });
  } catch (error) {
    console.error("Error in direct check:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to check" },
      { status: 500 }
    );
  }
}

