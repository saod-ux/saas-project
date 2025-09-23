import { NextRequest, NextResponse } from 'next/server';
import { prismaRW } from '@/lib/db';
import { loadTenantBySlug } from '@/lib/loadTenant';
import { findTenantUserByEmail, createTenantUser } from '@/lib/tenant-user';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
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
    const validatedData = signupSchema.parse(body);
    const { email, password, name, phone } = validatedData;

    // Check if customer already exists
    const existingCustomer = await findTenantUserByEmail(tenant.id, email);
    if (existingCustomer) {
      return NextResponse.json(
        { ok: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await createTenantUser({
      tenantId: tenant.id,
      email,
      name,
      phone,
      isGuest: false,
    });

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Update customer with password
    const updatedCustomer = await prismaRW.tenantUser.update({
      where: { id: customer.id },
      data: { password: hashedPassword },
    });

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
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
