import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/auth-server";

export async function requirePlatformRole(req: Request, role: "SUPER_ADMIN"|"ADMIN") {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
    }

    // Verify the Firebase ID token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
    }

    const email = decodedToken.email;
    if (!email) {
      return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
    }

    // Find the user in Firestore - for platform admin, we need to check the platformAdmins collection
    // For now, we'll create a simple check - in a real app, you'd query the platformAdmins collection
    const dbUser = { id: decodedToken.uid, email, role: "ADMIN" };
    if (!dbUser) {
      return NextResponse.json({ ok:false, error:"FORBIDDEN" }, { status:403 });
    }

    // Check if user has platform admin role
    if (role === "SUPER_ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ ok:false, error:"FORBIDDEN" }, { status:403 });
    }

    return { userId: dbUser.id, email, role: dbUser.role || "ADMIN" };
  } catch (error) {
    console.error('Platform role check failed:', error);
    return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
  }
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  firebaseUid?: string
}

export interface TenantMember {
  id: string
  userId: string
  tenantId: string
  role: UserRole
  status: string
  user: AuthUser
}

// Get current user from Firebase
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // This function should be called from API routes with proper token verification
    // For now, return null as this should be handled by the calling context
    return null;
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get current user's membership for a specific tenant
export async function getCurrentMembership(tenantId: string): Promise<TenantMember | null> {
  try {
    // This function should be called from API routes with proper token verification
    // For now, return null as this should be handled by the calling context
    return null;
  } catch (error) {
    console.error('Error getting current membership:', error)
    return null
  }
}

// Require specific role in a tenant
export async function requireRole(tenantId: string, requiredRole: UserRole): Promise<TenantMember> {
  const membership = await getCurrentMembership(tenantId)
  if (!membership) {
    throw new Error('Membership required')
  }
  if (membership.status !== 'ACTIVE') {
    throw new Error('Active membership required')
  }
  
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