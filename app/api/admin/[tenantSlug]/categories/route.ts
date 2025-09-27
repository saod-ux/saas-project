import { NextRequest, NextResponse } from "next/server";
import { createTenantCategory } from "@/lib/firebase/tenant";
import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments, COLLECTIONS } from "@/lib/firebase/db";
import { z } from "zod";
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses';

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
      return notFound("Tenant not found");
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

    return ok(sortedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch categories");
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
      return notFound("Tenant not found");
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

    return ok(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return badRequest("Validation error", { details: error.errors });
    }
    return errorResponse(error instanceof Error ? error.message : "Failed to create category");
  }
}
