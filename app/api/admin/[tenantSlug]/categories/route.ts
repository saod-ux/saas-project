import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug, createTenantCategory } from "@/lib/firebase/tenant";
import { getTenantDocuments, COLLECTIONS } from "@/lib/firebase/db";
import { z } from "zod";

export const runtime = "nodejs";

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  slug: z.string().min(1, "Slug is required"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().refine((val) => !val || val === "" || val.startsWith('/') || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL, relative path, or empty string"
  }).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Get tenant by slug
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found" },
        { status: 404 }
      );
    }
    
    // Get categories from Firebase
    const categories = await getTenantDocuments(COLLECTIONS.CATEGORIES, tenant.id);
    
    // Sort categories by sortOrder and name
    const sortedCategories = categories
      .sort((a: any, b: any) => {
        if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return (a.name || '').localeCompare(b.name || '');
      })
      .map((category: any) => ({
        ...category,
        _count: {
          products: 0 // TODO: Implement product count
        }
      }));

    return NextResponse.json({ ok: true, data: sortedCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    // Get tenant by slug
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    console.log('Received create category data:', body);
    const validatedData = CreateCategorySchema.parse(body);
    console.log('Validated create category data:', validatedData);

    // Create category using Firebase
    const category = await createTenantCategory(tenant.id, {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: validatedData.name,
      nameAr: validatedData.nameAr,
      slug: validatedData.slug,
      sortOrder: validatedData.order,
      isActive: validatedData.isActive,
      imageUrl: validatedData.imageUrl ?? null,
    });

    return NextResponse.json({ ok: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    );
  }
}
