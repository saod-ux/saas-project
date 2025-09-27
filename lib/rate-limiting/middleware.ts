/**
 * Rate Limiting Middleware
 * 
 * Provides middleware functions to apply rate limiting to API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getClientIdentifier, createRateLimitHeaders, RateLimiter } from './limiter';
import { logger } from '@/lib/logging';

export interface RateLimitOptions {
  limiter?: RateLimiter;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

export function withRateLimit(options: RateLimitOptions = {}) {
  const {
    limiter = rateLimiters.api,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => getClientIdentifier(req)
  } = options;

  return function<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const request = args[0] as NextRequest;
      const identifier = keyGenerator(request);
      const endpoint = request.nextUrl.pathname;

      // Check rate limit before processing
      const rateLimitResult = limiter.hit(identifier, endpoint);

      // Add rate limit headers to response
      const headers = createRateLimitHeaders(rateLimitResult);

      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          endpoint,
          totalHits: rateLimitResult.totalHits,
          resetTime: rateLimitResult.resetTime
        });

        return NextResponse.json(
          { 
            ok: false, 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers
          }
        );
      }

      try {
        // Execute the original handler
        const response = await handler(...args);

        // Add rate limit headers to successful response
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      } catch (error) {
        // Add rate limit headers to error response
        const errorResponse = NextResponse.json(
          { 
            ok: false, 
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          },
          { 
            status: 500,
            headers
          }
        );

        return errorResponse;
      }
    };
  };
}

// Convenience functions for common rate limiting scenarios
export const withAuthRateLimit = withRateLimit({ 
  limiter: rateLimiters.auth,
  keyGenerator: (req) => {
    // For auth endpoints, use IP + user agent for more specific limiting
    const ip = getClientIdentifier(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`;
  }
});

export const withApiRateLimit = withRateLimit({ 
  limiter: rateLimiters.api 
});

export const withPublicRateLimit = withRateLimit({ 
  limiter: rateLimiters.public 
});

export const withSensitiveRateLimit = withRateLimit({ 
  limiter: rateLimiters.sensitive 
});

// Custom rate limiter for specific endpoints
export function createCustomRateLimit(config: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return withRateLimit({
    limiter: new (require('./limiter').RateLimiter)(config)
  });
}

