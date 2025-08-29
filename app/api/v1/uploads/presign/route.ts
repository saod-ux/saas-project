import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { requireMembership } from '@/lib/auth'
import { createPresignedUpload } from '@/lib/upload'
import { z } from 'zod'

const presignSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive().max(10 * 1024 * 1024).optional() // 10MB max, optional for now
}).passthrough() // Allow additional fields

// POST /api/v1/uploads/presign - Generate presigned upload URL
export async function POST(request: NextRequest) {
  try {
    console.log('=== Presign endpoint called ===')
    
    // Step 1: Get tenant
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    console.log('Slug header:', slugHeader)
    
    if (!slugHeader) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }
    
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(slugHeader)
    console.log('Tenant found:', tenant?.id, tenant?.name)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Step 2: Check membership (simplified)
    console.log('Checking membership for tenant:', tenant.id)
    const { auth } = await import('@clerk/nextjs/server')
    
    // Get Clerk auth directly (same as simple test)
    const clerkAuth = await auth()
    console.log('Clerk auth:', { userId: clerkAuth.userId, sessionId: clerkAuth.sessionId })
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Find user directly in database using Clerk ID
    const { prismaRO } = await import('@/lib/db')
    const user = await prismaRO.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    })
    
    console.log('User found:', user?.id, user?.email, user?.clerkId)
    
    if (!user) {
      // Let's check what users exist in the database
      const allUsers = await prismaRO.user.findMany({
        select: { id: true, email: true, clerkId: true }
      })
      console.log('All users in database:', allUsers)
      
      return NextResponse.json(
        { error: 'User not found in database', clerkUserId: clerkAuth.userId, dbUsers: allUsers },
        { status: 401 }
      )
    }
    
    // Find membership directly in database
    const membership = await prismaRO.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: tenant.id
      },
      include: {
        user: true
      }
    })
    
    console.log('Membership found:', membership?.id, membership?.role, membership?.status)
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 403 }
      )
    }
    
    if (membership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Membership not active' },
        { status: 403 }
      )
    }
    
    // Step 3: Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    const validatedData = presignSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Step 4: Generate presigned upload data
    console.log('Generating presigned upload...')
    const { createPresignedUpload } = await import('@/lib/upload')
    const presignedData = await createPresignedUpload(
      tenant.id,
      validatedData.fileName,
      validatedData.fileType,
      validatedData.fileSize || 1024 * 1024 // Default 1MB if not provided
    )
    console.log('Presigned data generated:', presignedData)

    return NextResponse.json({ 
      data: presignedData,
      message: 'Presigned upload URL generated'
    })

  } catch (error: any) {
    console.error('=== Presign endpoint error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'ZodError') {
      console.error('Zod validation errors:', error.issues)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.issues,
          receivedBody: error.issues?.[0]?.path ? 'Check path: ' + error.issues[0].path.join('.') : 'Unknown field'
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
