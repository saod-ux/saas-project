import { NextRequest, NextResponse } from 'next/server';
import { getTenantDocuments, createDocument, updateDocument } from '@/lib/firebase/tenant';
import { getTenantBySlug } from '@/lib/services/tenant';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses';
import { withAuthRateLimit } from '@/lib/rate-limiting';
import { sanitizeEmail, sanitizeBasic, isValidEmail } from '@/lib/security/sanitization';
import { validateBody, schemas } from '@/lib/validation';

// Use the comprehensive user schema from our validation system
const signupSchema = schemas.CreateUser.pick({
  email: true,
  name: true,
  phone: true,
}).extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const POST = withAuthRateLimit(async function(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params;
    
    // Load tenant
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return notFound('Store not found');
    }

    const body = await request.json();
    
    // Validate data using our schema
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequest('Validation failed', { 
        details: validationResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Sanitize validated data
    const sanitizedData = {
      email: sanitizeEmail(validationResult.data.email || ''),
      password: validationResult.data.password || '', // Don't sanitize passwords
      name: sanitizeBasic(validationResult.data.name || ''),
      phone: validationResult.data.phone ? sanitizeBasic(validationResult.data.phone) : undefined
    };
    
    // Additional email validation
    if (!isValidEmail(sanitizedData.email)) {
      return badRequest('Invalid email address');
    }
    const { email, password, name, phone } = sanitizedData;

    // Check if customer already exists
    const allUsers = await getTenantDocuments('users', '');
    const existingCustomer = allUsers.find((user: any) => 
      user.email === email && user.tenantId === tenant.id
    );
    
    if (existingCustomer) {
      return badRequest('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await createDocument('users', {
      tenantId: tenant.id,
      email,
      name,
      phone,
      isGuest: false,
      password: hashedPassword,
      createdAt: new Date()
    });

    if (!customer) {
      return errorResponse('Failed to create account');
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
    return ok({
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
    }, 201);

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', { details: error.errors });
    }

    return errorResponse('Signup failed');
  }
});
