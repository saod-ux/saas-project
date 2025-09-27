/**
 * Security Headers Configuration
 * 
 * Provides comprehensive security headers for production applications
 * including CSP, HSTS, and other security-related headers.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  xXssProtection?: string;
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

// Default security headers configuration
export const securityHeadersConfig: SecurityHeadersConfig = {
  // Content Security Policy - restrict resource loading
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseapp.com wss://*.firebase.com",
    "frame-src 'self' https://*.google.com https://*.firebase.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // HTTP Strict Transport Security - force HTTPS
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

  // Prevent clickjacking
  xFrameOptions: 'DENY',

  // Prevent MIME type sniffing
  xContentTypeOptions: 'nosniff',

  // Control referrer information
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions Policy - control browser features
  permissionsPolicy: [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),

  // XSS Protection (legacy but still useful)
  xXssProtection: '1; mode=block',

  // Cross-Origin policies
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'cross-origin'
};

// Development-specific headers (more permissive)
export const developmentSecurityHeaders: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:* https://*.googleapis.com https://*.firebase.com https://*.firebaseapp.com wss://*.firebase.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  xFrameOptions: 'SAMEORIGIN',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  xXssProtection: '1; mode=block'
};

export function addSecurityHeaders(response: NextResponse, config: SecurityHeadersConfig = securityHeadersConfig): NextResponse {
  // Apply all security headers
  if (config.contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', config.contentSecurityPolicy);
  }
  
  if (config.strictTransportSecurity) {
    response.headers.set('Strict-Transport-Security', config.strictTransportSecurity);
  }
  
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }
  
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', config.xContentTypeOptions);
  }
  
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }
  
  if (config.permissionsPolicy) {
    response.headers.set('Permissions-Policy', config.permissionsPolicy);
  }
  
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', config.xXssProtection);
  }
  
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy);
  }
  
  if (config.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
  }
  
  if (config.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
  }

  return response;
}

// Helper function to create security headers middleware
export function withSecurityHeaders(config?: SecurityHeadersConfig) {
  return function<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      // Execute the original handler
      const response = await handler(...args);

      // Add security headers to the response
      return addSecurityHeaders(response, config);
    };
  };
}

// Convenience functions for different environments
export const withProductionSecurityHeaders = withSecurityHeaders(securityHeadersConfig);
export const withDevelopmentSecurityHeaders = withSecurityHeaders(developmentSecurityHeaders);

// Custom security headers for API endpoints
export const apiSecurityHeaders: SecurityHeadersConfig = {
  contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'",
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'no-referrer',
  xXssProtection: '1; mode=block'
};

export const withApiSecurityHeaders = withSecurityHeaders(apiSecurityHeaders);

