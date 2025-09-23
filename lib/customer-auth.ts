import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prismaRW } from './db';
import { getTenantUserById } from './tenant-user';

export interface CustomerSession {
  customerId: string;
  tenantId: string;
  email: string;
  type: 'customer';
}

export async function getCustomerFromToken(request: NextRequest): Promise<CustomerSession | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.type !== 'customer') {
      return null;
    }

    return {
      customerId: decoded.customerId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      type: 'customer' as const,
    };
  } catch (error) {
    return null;
  }
}

export async function getCustomerWithSession(request: NextRequest, tenantId: string) {
  try {
    const session = await getCustomerFromToken(request);
    if (!session || session.tenantId !== tenantId) {
      return null;
    }

    const customer = await getTenantUserById(tenantId, session.customerId);
    return customer;
  } catch (error) {
    return null;
  }
}

export function createCustomerToken(customerId: string, tenantId: string, email: string): string {
  return jwt.sign(
    { 
      customerId,
      tenantId,
      email,
      type: 'customer'
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
}

