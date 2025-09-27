/**
 * CORS Configuration
 * 
 * Provides configurable CORS policies for different types of endpoints
 * with proper security considerations for production environments.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CorsConfig {
  origin: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

// Default CORS configurations for different endpoint types
export const corsConfigs = {
  // Strict CORS for authentication endpoints
  auth: {
    origin: (origin: string) => {
      // Allow same-origin requests
      if (!origin) return true;
      
      // In production, specify allowed domains
      const allowedOrigins = [
        'http://localhost:3000',
        'https://yourdomain.com',
        'https://www.yourdomain.com'
      ];
      
      return allowedOrigins.includes(origin);
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Moderate CORS for general API endpoints
  api: {
    origin: (origin: string) => {
      if (!origin) return true;
      
      const allowedOrigins = [
        'http://localhost:3000',
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://admin.yourdomain.com'
      ];
      
      return allowedOrigins.includes(origin);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  },

  // Lenient CORS for public endpoints (like storefront)
  public: {
    origin: true, // Allow all origins for public endpoints
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400
  },

  // Very strict CORS for admin endpoints
  admin: {
    origin: (origin: string) => {
      if (!origin) return false; // Require origin for admin endpoints
      
      const allowedOrigins = [
        'https://admin.yourdomain.com',
        'http://localhost:3000' // For development
      ];
      
      return allowedOrigins.includes(origin);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600 // 1 hour
  }
};

export function addCorsHeaders(response: NextResponse, request: NextRequest, config: CorsConfig): NextResponse {
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  let allowedOrigin = false;
  if (typeof config.origin === 'function') {
    allowedOrigin = config.origin(origin || '');
  } else if (Array.isArray(config.origin)) {
    allowedOrigin = config.origin.includes(origin || '');
  } else if (config.origin === true) {
    allowedOrigin = true;
  } else {
    allowedOrigin = config.origin === origin;
  }

  // Set CORS headers
  if (allowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  if (config.methods) {
    response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  }
  
  if (config.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  }
  
  if (config.exposedHeaders) {
    response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }
  
  if (config.credentials !== undefined) {
    response.headers.set('Access-Control-Allow-Credentials', config.credentials.toString());
  }
  
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  return response;
}

export function handleCorsPreflight(request: NextRequest, config: CorsConfig): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  let allowedOrigin = false;
  if (typeof config.origin === 'function') {
    allowedOrigin = config.origin(origin || '');
  } else if (Array.isArray(config.origin)) {
    allowedOrigin = config.origin.includes(origin || '');
  } else if (config.origin === true) {
    allowedOrigin = true;
  } else {
    allowedOrigin = config.origin === origin;
  }

  if (!allowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request, config);
}

// Helper function to create CORS middleware
export function withCors(config: CorsConfig) {
  return function<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const request = args[0] as NextRequest;
      
      // Handle preflight requests
      const preflightResponse = handleCorsPreflight(request, config);
      if (preflightResponse) {
        return preflightResponse;
      }

      // Execute the original handler
      const response = await handler(...args);

      // Add CORS headers to the response
      return addCorsHeaders(response, request, config);
    };
  };
}

// Convenience functions for common CORS scenarios
export const withAuthCors = withCors(corsConfigs.auth);
export const withApiCors = withCors(corsConfigs.api);
export const withPublicCors = withCors(corsConfigs.public);
export const withAdminCors = withCors(corsConfigs.admin);

