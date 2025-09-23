import { NextRequest, NextResponse } from 'next/server';
import { prismaRW } from '@/lib/db';
import { loadTenantBySlug } from '@/lib/loadTenant';
import { findTenantUserByEmail } from '@/lib/tenant-user';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params;
    
    // Load tenant
    const tenant = await loadTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Find customer by email within this tenant
    const customer = await findTenantUserByEmail(tenant.id, email);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if customer has a password (not guest)
    if (!customer.password) {
      return NextResponse.json(
        { ok: false, error: 'Please sign up first or use guest checkout' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        tenantId: tenant.id,
        email: customer.email,
        type: 'customer'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return customer data and token
    return NextResponse.json({
      ok: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          isGuest: customer.isGuest,
        },
        token,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

