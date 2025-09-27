import { NextRequest } from 'next/server';
import { getTenantDocuments } from '@/lib/firebase/tenant';
import { getTenantBySlug } from '@/lib/services/tenant';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ok, badRequest, notFound, errorResponse } from '@/lib/http/responses';
import { logger, createRequestContext } from '@/lib/logging';
import { withAuthRateLimit } from '@/lib/rate-limiting';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const POST = withAuthRateLimit(async function(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const context = createRequestContext(request);
  const startedAt = Date.now();
  
  try {
    const { tenantSlug } = params;
    
    logger.info('Customer login attempt', { ...context, tenantSlug });
    
    // Load tenant
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      logger.warn('Login failed: tenant not found', { ...context, tenantSlug });
      return notFound('Store not found');
    }

    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    logger.info('Login validation passed', { ...context, tenantSlug, tenantId: tenant.id, email });

    // Find customer by email within this tenant
    const allUsers = await getTenantDocuments('users', '');
    const customer = allUsers.find((user: any) => 
      user.email === email && user.tenantId === tenant.id
    );
    
    if (!customer) {
      logger.warn('Login failed: customer not found', { ...context, tenantSlug, tenantId: tenant.id, email });
      return errorResponse('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    // Check if customer has a password (not guest)
    if (!customer.password) {
      logger.warn('Login failed: customer has no password', { ...context, tenantSlug, tenantId: tenant.id, customerId: customer.id });
      return errorResponse('Please sign up first or use guest checkout', 'UNAUTHORIZED', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      logger.warn('Login failed: invalid password', { ...context, tenantSlug, tenantId: tenant.id, customerId: customer.id });
      return errorResponse('Invalid email or password', 'UNAUTHORIZED', 401);
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

    const duration = Date.now() - startedAt;
    logger.info('Customer login successful', { 
      ...context, 
      tenantSlug, 
      tenantId: tenant.id, 
      customerId: customer.id,
      duration
    });

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
    });

  } catch (error) {
    const duration = Date.now() - startedAt;
    
    if (error instanceof z.ZodError) {
      logger.warn('Login validation failed', { ...context, tenantSlug, validationErrors: error.errors, duration });
      return badRequest({ message: 'Validation error', details: error.errors });
    }

    logger.error('Login error', { ...context, tenantSlug, duration }, error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Login failed');
  }
});

