/**
 * Logging Middleware for API Routes
 * 
 * Provides request/response logging with tenant context and performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './logger';

export interface RequestLogContext extends LogContext {
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
}

export function withLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    
    // Extract request context
    const context: RequestLogContext = {
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      startTime,
    };

    // Extract tenant context from path
    const pathParts = request.nextUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'api') {
      context.tenantSlug = pathParts[0];
    }

    // Log request
    logger.apiRequest(request.method, request.nextUrl.pathname, context);

    try {
      // Execute handler
      const response = await handler(...args);
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log response
      logger.apiResponse(
        request.method, 
        request.nextUrl.pathname, 
        response.status, 
        duration,
        { ...context, duration }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      logger.error(
        `API ${request.method} ${request.nextUrl.pathname} failed`,
        { ...context, duration },
        error instanceof Error ? error : new Error(String(error))
      );

      throw error;
    }
  };
}

export function createRequestContext(request: NextRequest): LogContext {
  const context: LogContext = {
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
  };

  // Extract tenant context from path
  const pathParts = request.nextUrl.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && pathParts[0] !== 'api') {
    context.tenantSlug = pathParts[0];
  }

  return context;
}

export function extractTenantFromRequest(request: NextRequest): { tenantSlug?: string; tenantId?: string } {
  const pathParts = request.nextUrl.pathname.split('/').filter(Boolean);
  
  // Handle different path patterns:
  // /api/admin/[tenantSlug]/... -> tenantSlug
  // /api/storefront/[tenantSlug]/... -> tenantSlug
  // /[tenantSlug]/... -> tenantSlug
  
  if (pathParts.length >= 3 && pathParts[0] === 'api') {
    // API routes: /api/admin/[tenantSlug] or /api/storefront/[tenantSlug]
    if (pathParts[1] === 'admin' || pathParts[1] === 'storefront') {
      return { tenantSlug: pathParts[2] };
    }
  } else if (pathParts.length >= 1 && pathParts[0] !== 'api') {
    // Direct tenant routes: /[tenantSlug]
    return { tenantSlug: pathParts[0] };
  }

  return {};
}

