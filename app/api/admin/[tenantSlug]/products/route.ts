import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments, createDocument } from "@/lib/db";
import { requireTenantAndRole } from "@/lib/rbac";
import { enforceLimit } from "@/lib/limits";
import { z } from "zod";

const CreateProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional(),
  currency: z.string().default("KWD"),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.string().default("active"),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnOffer: z.boolean().default(false),
  featured: z.boolean().default(false),
  primaryCategoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  sku: z.string().optional(),
  prepTimeDays: z.coerce.number().int().min(0).optional(),
  customFields: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Field title is required"),
    options: z.array(z.string().min(1, "Option cannot be empty")).min(1, "At least one option is required")
  })).optional().default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    // Get products from Firebase
    const products = await getTenantDocuments('products', tenant.id);
    
    // Sort by createdAt descending
    const sortedProducts = products.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });

    // Add computed primaryImageUrl field
    const productsWithPrimaryImage = sortedProducts.map((product: any) => ({
      ...product,
      primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]) || null,
    }));

    return NextResponse.json({ ok: true, data: productsWithPrimaryImage });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    // Check product limits
    const limitCheck = await enforceLimit(tenant.id, 'products', 1);
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: limitCheck.error },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);

    // Determine primary image URL
    const primaryImageUrl = validatedData.images && validatedData.images.length > 0 
      ? validatedData.images[0] 
      : validatedData.imageUrl;

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const productData = {
      id: productId,
      tenantId: tenant.id,
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      compareAtPrice: validatedData.compareAtPrice,
      currency: validatedData.currency,
      stock: validatedData.stock,
      prepTimeDays: validatedData.prepTimeDays || null,
      status: validatedData.status,
      isBestSeller: validatedData.isBestSeller,
      isNewArrival: validatedData.isNewArrival,
      isOnOffer: validatedData.isOnOffer,
      featured: validatedData.featured,
      primaryCategoryId: validatedData.primaryCategoryId || null,
      imageUrl: primaryImageUrl, // Set first image as primary
      gallery: validatedData.images || [],
      sku: validatedData.sku,
      customFields: validatedData.customFields ? validatedData.customFields.filter(field => 
        field.title && field.title.trim() && field.options && field.options.length > 0
      ) : [],
      seoJson: {}, // Default empty SEO object
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = await createDocument('products', productData);

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
