import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantDocuments, updateDocument, deleteDocument } from '@/lib/db'
import { requireTenantAndRole } from '@/lib/rbac'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  currency: z.enum(['KWD', 'USD']).default('KWD'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnOffer: z.boolean().default(false),
  featured: z.boolean().default(false),
  stockQuantity: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  primaryCategoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
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
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        status: product.status,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        isOnOffer: product.isOnOffer,
        featured: product.featured,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        primaryCategoryId: product.primaryCategoryId,
        imageUrl: product.imageUrl,
        gallery: product.gallery,
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
      
      return NextResponse.json({
        ok: true,
        data: transformedProduct
      })
    }

    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
    console.log('Received product update data:', body) // Debug log
    const validatedData = updateProductSchema.parse(body)
    console.log('Validated product data:', validatedData) // Debug log
    
    // Check if product exists and belongs to tenant
    const products = await getTenantDocuments('products', tenant.id)
    const existingProduct = products.find((p: any) => p.id === params.id)

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const updateData = {
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      currency: validatedData.currency,
      status: validatedData.status,
      isBestSeller: validatedData.isBestSeller,
      isNewArrival: validatedData.isNewArrival,
      isOnOffer: validatedData.isOnOffer,
      featured: validatedData.featured,
      stock: validatedData.stockQuantity,
      lowStockThreshold: validatedData.lowStockThreshold,
      primaryCategoryId: validatedData.primaryCategoryId || null,
      imageUrl: validatedData.imageUrl || null,
      gallery: validatedData.images || [],
      updatedAt: new Date()
    }
    
    const updatedProduct = await updateDocument('products', params.id, updateData)

    return NextResponse.json({
      ok: true,
      data: {
        id: params.id,
        title: validatedData.title,
        status: validatedData.status,
        updatedAt: new Date()
      },
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product
    await deleteDocument('products', params.id)

    return NextResponse.json({
      ok: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}