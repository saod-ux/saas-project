import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantDocuments, updateDocument, deleteDocument } from '@/lib/db'
import { requireTenantAndRole } from '@/lib/rbac'
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses'
import { normalizeNumericInput } from '@/lib/utils/arabic-numerals'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateProductSchema = z.object({
  name: z.string().min(1).max(200),
  nameAr: z.string().optional(),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  currency: z.enum(['KWD', 'USD']).default('KWD'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  inventory: z.object({
    quantity: z.number().min(0).default(0),
    trackInventory: z.boolean().default(true),
    allowOutOfStockPurchases: z.boolean().default(false),
  }).optional(),
  primaryCategoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  gallery: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'EDITOR'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    // Get product from Firestore
    const products = await getTenantDocuments('products', tenant.id)
    const product = products.find((p: any) => p.id === params.id)
    
    if (product) {
      // Get product images and primary category
      const productImages = await getTenantDocuments('productImages', tenant.id)
      const categories = await getTenantDocuments('categories', tenant.id)
      
      const productImagesForProduct = productImages.filter((img: any) => img.productId === product.id)
      const primaryCategory = product.primaryCategoryId ? 
        categories.find((c: any) => c.id === product.primaryCategoryId) : null
      
      // Transform to match expected format
      const transformedProduct = {
        id: product.id,
        name: product.name, // Use 'name' consistently
        description: product.description,
        price: product.price,
        currency: product.currency || 'KWD',
        status: product.status,
        isBestSeller: product.isBestSeller || false,
        isNewArrival: product.isNewArrival || false,
        isFeatured: product.isFeatured || false,
        inventory: product.inventory || {
          quantity: 0,
          trackInventory: true,
          allowOutOfStockPurchases: false
        },
        primaryCategoryId: product.primaryCategoryId,
        imageUrl: product.imageUrl,
        images: product.images || [],
        productImages: productImagesForProduct.map((img: any) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary
        })),
        primaryCategory: primaryCategory ? {
          id: primaryCategory.id,
          name: primaryCategory.name
        } : null
      }
      
      return ok(transformedProduct)
    }

    return notFound('Product not found')

  } catch (error) {
    console.error('Error fetching product:', error)
    return errorResponse('Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'EDITOR'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    const body = await request.json()
    console.log('Received product update data:', body)
    
    // Normalize numeric inputs (handle Arabic numerals)
    if (body.price) body.price = normalizeNumericInput(body.price.toString());
    if (body.compareAtPrice) body.compareAtPrice = normalizeNumericInput(body.compareAtPrice.toString());
    if (body.costPrice) body.costPrice = normalizeNumericInput(body.costPrice.toString());
    if (body.inventory?.quantity) body.inventory.quantity = normalizeNumericInput(body.inventory.quantity.toString());
    
    const validatedData = updateProductSchema.parse(body)
    console.log('Validated product data:', validatedData)
    
    // Check if product exists and belongs to tenant
    const products = await getTenantDocuments('products', tenant.id)
    const existingProduct = products.find((p: any) => p.id === params.id)

    if (!existingProduct) {
      return notFound('Product not found')
    }

    // Update product
    const updateData = {
      name: validatedData.name,
      nameAr: validatedData.nameAr || null,
      description: validatedData.description,
      price: validatedData.price,
      compareAtPrice: validatedData.compareAtPrice || null,
      costPrice: validatedData.costPrice || null,
      currency: validatedData.currency,
      status: validatedData.status,
      isBestSeller: validatedData.isBestSeller,
      isNewArrival: validatedData.isNewArrival,
      isFeatured: validatedData.isFeatured,
      inventory: validatedData.inventory || {
        quantity: 0,
        trackInventory: true,
        allowOutOfStockPurchases: false
      },
      primaryCategoryId: validatedData.primaryCategoryId || null,
      imageUrl: validatedData.imageUrl || null,
      images: validatedData.images || [],
      gallery: validatedData.gallery || [],
      updatedAt: new Date()
    }
    
    const updatedProduct = await updateDocument('products', params.id, updateData)

    return ok({
      id: params.id,
      name: validatedData.name, // Use 'name' consistently
      status: validatedData.status,
      updatedAt: new Date()
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
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
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    // Check if product exists and belongs to tenant
    const products = await getTenantDocuments('products', tenant.id)
    const existingProduct = products.find((p: any) => p.id === params.id)

    if (!existingProduct) {
      return notFound('Product not found')
    }

    // Delete product
    await deleteDocument('products', params.id)

    return ok({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('Error deleting product:', error)
    return errorResponse('Internal server error')
  }
}