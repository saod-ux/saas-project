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
    
    console.log("Before update - tenant data:", tenantDoc.data());
    
    // Update tenant directly using Firestore
    const updateData = {
      logoUrl: body.logoUrl || null,
      heroImages: body.heroImages || [],
      heroVideoUrl: body.heroVideoUrl || null,
      updatedAt: new Date(),
    };
    
    console.log("Update data:", updateData);
    
    await tenantDoc.ref.update(updateData);
    
    console.log("Update completed");
    
    // Get tenant again to verify
    const updatedDoc = await tenantDoc.ref.get();
    const updatedData = updatedDoc.data();
    
    console.log("After update - tenant data:", updatedData);
    
    return NextResponse.json({ 
      ok: true, 
      message: "Updated successfully",
      beforeUpdate: tenantDoc.data(),
      afterUpdate: updatedData,
      updateData: updateData
    });
  } catch (error) {
    console.error("Error testing Firestore update:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}

