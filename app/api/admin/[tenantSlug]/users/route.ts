import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getTenantDocuments } from '@/lib/db';
import { ok, errorResponse } from '@/lib/http/responses';

/**
 * GET /api/admin/[tenantSlug]/users
 * Get all users for a tenant (admin only)
 */
export const GET = withAuth(
  async (request: NextRequest, userContext, { params }: { params: { tenantSlug: string } }) => {
    try {
      const { tenantSlug } = params;
      
      // Verify tenant access
      if (userContext.userType === 'merchant_admin' && userContext.tenantSlug !== tenantSlug) {
        return NextResponse.json(
          { error: 'Access denied to this tenant' },
          { status: 403 }
        );
      }

      // Get users for the tenant
      const users = await getTenantDocuments('tenantUsers', userContext.tenantId || '');
      
      // Filter out sensitive information
      const safeUsers = users.map((user: any) => ({
        id: user.id,
        uid: user.uid,
        email: user.email,
        role: user.role,
        userType: user.userType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      return ok(safeUsers);
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      return errorResponse('Failed to fetch users');
    }
  },
  {
    userType: ['merchant_admin', 'platform_admin'],
    permission: 'manage_customers'
  }
);

/**
 * POST /api/admin/[tenantSlug]/users
 * Create a new user for a tenant (admin only)
 */
export const POST = withAuth(
  async (request: NextRequest, userContext, { params }: { params: { tenantSlug: string } }) => {
    try {
      const { tenantSlug } = params;
      const body = await request.json();
      
      // Verify tenant access
      if (userContext.userType === 'merchant_admin' && userContext.tenantSlug !== tenantSlug) {
        return NextResponse.json(
          { error: 'Access denied to this tenant' },
          { status: 403 }
        );
      }

      // Validate required fields
      if (!body.email || !body.role) {
        return NextResponse.json(
          { error: 'Email and role are required' },
          { status: 400 }
        );
      }

      // Create user document
      const userData = {
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: body.email,
        role: body.role,
        userType: 'merchant_admin',
        tenantId: userContext.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real implementation, you would create the user in Firebase Auth
      // and then create the document in Firestore
      // For now, we'll just return the user data structure
      
      return ok(userData);
    } catch (error) {
      console.error('Error creating tenant user:', error);
      return errorResponse('Failed to create user');
    }
  },
  {
    userType: ['merchant_admin', 'platform_admin'],
    permission: 'manage_customers'
  }
);

