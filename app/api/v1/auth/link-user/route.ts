import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getTenantBySlug, getTenantDocuments, createDocument } from '@/lib/firebase/tenant'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the demo tenant
    const demoTenant = await getTenantBySlug('demo-store')

    if (!demoTenant) {
      return NextResponse.json(
        { error: 'Demo tenant not found' },
        { status: 404 }
      )
    }

    // Check if user already has membership
    const allMemberships = await getTenantDocuments('memberships', demoTenant.id)
    const existingMembership = allMemberships.find((m: any) => 
      m.userId === user.id
    )

    if (existingMembership) {
      return NextResponse.json({
        message: 'User already linked to demo tenant',
        data: { tenantId: demoTenant.id }
      })
    }

    // Create membership with OWNER role
    const membership = await createDocument('memberships', {
      userId: user.id,
      tenantId: demoTenant.id,
      role: 'OWNER',
      status: 'ACTIVE'
    })

    return NextResponse.json({
      message: 'User successfully linked to demo tenant',
      data: { 
        membershipId: membership.id,
        tenantId: demoTenant.id,
        role: membership.role
      }
    })

  } catch (error: any) {
    console.error('Error linking user:', error)
    return NextResponse.json(
      { error: 'Failed to link user' },
      { status: 500 }
    )
  }
}







