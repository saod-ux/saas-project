import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prismaRW, prismaRO } from './db'

enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  clerkId: string
}

export interface TenantMember {
  id: string
  userId: string
  tenantId: string
  role: UserRole
  status: string
  user: AuthUser
}

// Get current user from Clerk
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    // Try to find user in database first
    const user = await prismaRO.user.findFirst({
      where: { clerkId: userId }
    })

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        clerkId: user.clerkId
      }
    }

    // If not found, return null (user needs to register)
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get current user's membership for a specific tenant
export async function getCurrentMembership(tenantId: string): Promise<TenantMember | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // Find membership in database
    const membership = await prismaRO.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: tenantId
      },
      include: {
        user: true
      }
    })

    if (!membership) return null

    return {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role as UserRole,
      status: membership.status,
      user: {
        id: membership.user.id,
        email: membership.user.email,
        name: membership.user.name,
        clerkId: membership.user.clerkId
      }
    }
  } catch (error) {
    console.error('Error getting current membership:', error)
    return null
  }
}

// Require authentication - redirects to sign-in if not authenticated
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  return user
}

// Require active membership in a tenant
export async function requireMembership(tenantId: string): Promise<TenantMember> {
  const membership = await getCurrentMembership(tenantId)
  if (!membership) {
    throw new Error('Membership required')
  }
  if (membership.status !== 'ACTIVE') {
    throw new Error('Active membership required')
  }
  return membership
}

// Require specific role in a tenant
export async function requireRole(tenantId: string, requiredRole: UserRole): Promise<TenantMember> {
  const membership = await requireMembership(tenantId)
  
  if (!hasPermission(membership.role, requiredRole)) {
    throw new Error(`Role ${requiredRole} required`)
  }
  
  return membership
}

// Check if user role has permission for required role
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.OWNER]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.STAFF]: 2,
    [UserRole.VIEWER]: 1
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Get all memberships for a user
export async function getUserMemberships(userId: string) {
  return prismaRO.membership.findMany({
    where: { userId },
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
}
