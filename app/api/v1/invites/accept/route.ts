import { NextRequest, NextResponse } from 'next/server'
import { prismaRW } from '@/lib/db'
import { z } from 'zod'

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1) // Clerk user ID
})

// POST /api/v1/invites/accept - Accept invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = acceptInviteSchema.parse(body)

    // Find the invitation
    const invite = await prismaRW.invite.findUnique({
      where: { token: validatedData.token }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    if (invite.accepted) {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 409 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Find or create user
    let user = await prismaRW.user.findUnique({
      where: { clerkId: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has membership
    const existingMembership = await prismaRW.membership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: invite.tenantId,
          userId: user.id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User already has membership in this tenant' },
        { status: 409 }
      )
    }

    // Create membership
    const membership = await prismaRW.membership.create({
      data: {
        tenantId: invite.tenantId,
        userId: user.id,
        role: invite.role,
        status: 'ACTIVE',
        invitedBy: invite.invitedBy,
        invitedAt: invite.createdAt,
        acceptedAt: new Date()
      }
    })

    // Mark invitation as accepted
    await prismaRW.invite.update({
      where: { id: invite.id },
      data: { accepted: true }
    })

    return NextResponse.json({ 
      data: membership,
      message: 'Invitation accepted successfully'
    })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
