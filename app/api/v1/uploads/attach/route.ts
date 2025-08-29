import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW } from '@/lib/db'

const attachSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  productId: z.string().min(1).optional(),
  alt: z.string().optional(),
  order: z.number().default(0)
})

// POST /api/v1/uploads/attach - Record uploaded file and optionally attach to product
export async function POST(request: NextRequest) {
  try {
    console.log('=== Attach endpoint called ===')
    
    // Get tenant
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    if (!slugHeader) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }
    
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(slugHeader)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Check membership
    const membership = await prismaRW.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: 'ACTIVE'
      }
    })
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    console.log('Attach request body:', body)
    const validatedData = attachSchema.parse(body)
    console.log('Validated attach data:', validatedData)

    // Record file in database
    const file = await prismaRW.file.create({
      data: {
        tenantId: tenant.id,
        key: validatedData.key,
        filename: validatedData.filename,
        mimeType: validatedData.mimeType,
        size: validatedData.size,
        uploadedBy: user.id,
        metadata: {}
      }
    })

    console.log('File recorded:', file.id)

    let productImage = null
    if (validatedData.productId) {
      // Attach to product if productId provided
      productImage = await prismaRW.productImage.create({
        data: {
          productId: validatedData.productId,
          fileId: file.id,
          alt: validatedData.alt,
          order: validatedData.order
        },
        include: {
          file: true,
          product: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
      
      console.log('File attached to product:', productImage.id)
    }

    return NextResponse.json({
      data: {
        file: {
          id: file.id,
          key: file.key,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          uploadedBy: file.uploadedBy
        },
        productImage: productImage ? {
          id: productImage.id,
          productId: productImage.productId,
          alt: productImage.alt,
          order: productImage.order,
          product: productImage.product
        } : null
      },
      message: productImage ? 'File uploaded and attached to product' : 'File uploaded successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('=== Attach endpoint error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'ZodError') {
      console.error('Zod validation errors:', error.issues)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.issues
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
