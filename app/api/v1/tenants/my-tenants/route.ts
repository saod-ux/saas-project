import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prismaRW } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all tenants where the user has a membership
    const memberships = await prismaRW.membership.findMany({
      where: {
        userId: user.id
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    const tenants = memberships.map(membership => membership.tenant)

    return NextResponse.json({ 
      data: tenants,
      message: 'Tenants retrieved successfully'
    })

  } catch (error: any) {
    console.error('Error fetching user tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}







