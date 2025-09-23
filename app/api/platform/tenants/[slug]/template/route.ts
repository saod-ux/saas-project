import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW } from '@/lib/db'

const updateTemplateSchema = z.object({
  template: z.enum(['RESTAURANT', 'RETAIL'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // TODO: In production, require platform role authentication
    // For now, allow in development
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add platform role check here
      // const user = await getCurrentUser()
      // if (!user || user.role !== 'PLATFORM_ADMIN') {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      // }
    }

    const { slug } = params
    const body = await request.json()
    
    // Validate request body
    const validatedData = updateTemplateSchema.parse(body)
    
    // Check if tenant exists
    const existingTenant = await prismaRW.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, template: true }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Update tenant template
    const updatedTenant = await prismaRW.tenant.update({
      where: { slug },
      data: { template: validatedData.template },
      select: {
        id: true,
        slug: true,
        name: true,
        template: true,
        status: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      ok: true,
      data: updatedTenant,
      message: `Template updated to ${validatedData.template}`
    })

  } catch (error) {
    console.error('Error updating tenant template:', error)
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const tenant = await prismaRW.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        template: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: tenant
    })

  } catch (error) {
    console.error('Error fetching tenant template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











