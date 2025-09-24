import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, updateDocument } from "@/lib/db";
import { requireTenantAndRole } from "@/lib/rbac";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; orderId: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    const body = await request.json();
    const validatedData = UpdateOrderStatusSchema.parse(body);
    
    // First, verify the order belongs to this tenant
    const orders = await getTenantDocuments('orders', tenant.id)
    const existingOrder = orders.find((o: any) => o.id === params.orderId)
    
    if (!existingOrder) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Update the order status
    const updatedOrder = await updateDocument('orders', params.orderId, { 
      status: validatedData.status 
    })
    
    // Revalidate dashboard and orders pages
    revalidatePath(`/admin/${params.tenantSlug}/overview`);
    revalidatePath(`/admin/${params.tenantSlug}/orders`);
    
    return NextResponse.json({ ok: true, data: updatedOrder }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid status value", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update order status" },
      { status: 500 }
    );
  }
}


