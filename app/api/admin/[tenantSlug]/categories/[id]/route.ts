import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantCategoryById, updateTenantCategory, deleteTenantCategory } from '@/lib/firebase/tenant'
import { getTenantBySlug } from '@/lib/services/tenant'
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9\u0600-\u06FF-]+$/),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
  imageUrl: z.string().optional().refine((val) => !val || val === "" || val.startsWith('/') || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL, relative path, or empty string"
  }).nullable().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    // Get tenant
    const tenant = await getTenantBySlug(params.tenantSlug)
    if (!tenant) {
      return notFound('Tenant not found')
    }
    
    // Get category
    const category = await getTenantCategoryById(tenant.id, params.id)
    if (!category) {
      return notFound('Category not found')
    }
    
    // Add _count field for compatibility with UI
    const categoryWithCount = {
      ...category,
      _count: {
        products: 0 // TODO: Implement actual product count
      }
    }
    
    return ok(categoryWithCount)
  } catch (error) {
    console.error('Error fetching category:', error)
    return errorResponse('Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    // Get tenant
    const tenant = await getTenantBySlug(params.tenantSlug)
    if (!tenant) {
      return notFound('Tenant not found')
    }
    
    const body = await request.json()
    console.log('Received category update data:', body)
    const validatedData = updateCategorySchema.parse(body)
    console.log('Validated category data:', validatedData)
    
    // Check if category exists and belongs to tenant
    const existingCategory = await getTenantCategoryById(tenant.id, params.id)
    if (!existingCategory) {
      return notFound('Category not found')
    }

    // Update category - filter out undefined values and ensure all required fields are present
    const updateData: any = {
      name: validatedData.name,
      slug: validatedData.slug,
      isActive: validatedData.isActive,
      sortOrder: validatedData.sortOrder
    };
    
    // Only include description and imageUrl if they are defined and not empty
    if (validatedData.description !== undefined && validatedData.description !== null && validatedData.description !== '') {
      updateData.description = validatedData.description;
    }
    if (validatedData.imageUrl !== undefined && validatedData.imageUrl !== null && validatedData.imageUrl !== '') {
      updateData.imageUrl = validatedData.imageUrl;
    }
    
    const updatedCategory = await updateTenantCategory(tenant.id, params.id, updateData)

    // Add _count field for compatibility with UI
    const categoryWithCount = {
      ...updatedCategory,
      _count: {
        products: 0 // TODO: Implement actual product count
      }
    }

    return ok(categoryWithCount)
  } catch (error) {
    console.error('Error updating category:', error)
    
    if (error instanceof z.ZodError) {
      return badRequest('Invalid request data', { details: error.errors })
    }

    return errorResponse('Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    // Get tenant
    const tenant = await getTenantBySlug(params.tenantSlug)
    if (!tenant) {
      return notFound('Tenant not found')
    }
    
    // Check if category exists and belongs to tenant
    const existingCategory = await getTenantCategoryById(tenant.id, params.id)
    if (!existingCategory) {
      return notFound('Category not found')
    }

    // Delete category
    await deleteTenantCategory(tenant.id, params.id)

    return ok({ message: 'Category deleted successfully' })

  } catch (error) {
    console.error('Error deleting category:', error)
    return errorResponse('Internal server error')
  }
}