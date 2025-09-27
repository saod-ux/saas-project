/**
 * Input Sanitization and XSS Protection
 * 
 * Provides comprehensive input sanitization to prevent XSS attacks
 * and other injection vulnerabilities.
 */

import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
  stripHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
}

// Default sanitization options for different content types
export const sanitizationConfigs = {
  // Strict sanitization for user-generated content
  strict: {
    allowedTags: [],
    allowedAttributes: {},
    stripHtml: true,
    maxLength: 1000,
    trimWhitespace: true
  },

  // Moderate sanitization for rich text content
  richText: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    maxLength: 10000,
    trimWhitespace: true
  },

  // Lenient sanitization for admin content
  admin: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'class'],
      'table': ['class', 'border'],
      'td': ['colspan', 'rowspan', 'class'],
      'th': ['colspan', 'rowspan', 'class']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    maxLength: 50000,
    trimWhitespace: true
  },

  // Basic sanitization for simple text fields
  basic: {
    allowedTags: ['strong', 'em'],
    allowedAttributes: {},
    stripHtml: false,
    maxLength: 500,
    trimWhitespace: true
  }
};

export function sanitizeInput(input: string, options: SanitizationOptions = sanitizationConfigs.strict): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if requested
  if (options.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Check max length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Strip HTML if requested
  if (options.stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Use DOMPurify for HTML sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: options.allowedTags || [],
      ALLOWED_ATTR: options.allowedAttributes ? Object.values(options.allowedAttributes).flat() : [],
      ALLOWED_URI_REGEXP: options.allowedSchemes ? new RegExp(`^(${options.allowedSchemes.join('|')}):`) : undefined,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false
    });
  }

  return sanitized;
}

// Convenience functions for common sanitization scenarios
export const sanitizeStrict = (input: string) => sanitizeInput(input, sanitizationConfigs.strict);
export const sanitizeRichText = (input: string) => sanitizeInput(input, sanitizationConfigs.richText);
export const sanitizeAdmin = (input: string) => sanitizeInput(input, sanitizationConfigs.admin);
export const sanitizeBasic = (input: string) => sanitizeInput(input, sanitizationConfigs.basic);

// Specialized sanitization functions
export function sanitizeEmail(email: string): string {
  return sanitizeInput(email, {
    allowedTags: [],
    allowedAttributes: {},
    stripHtml: true,
    maxLength: 254, // RFC 5321 limit
    trimWhitespace: true
  }).toLowerCase();
}

export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeInput(url, {
    allowedTags: [],
    allowedAttributes: {},
    stripHtml: true,
    maxLength: 2048, // Common URL length limit
    trimWhitespace: true
  });

  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)) {
      return '';
    }
    return sanitized;
  } catch {
    return '';
  }
}

export function sanitizePhoneNumber(phone: string): string {
  return sanitizeInput(phone, {
    allowedTags: [],
    allowedAttributes: {},
    stripHtml: true,
    maxLength: 20,
    trimWhitespace: true
  }).replace(/[^\d+\-\(\)\s]/g, ''); // Keep only digits, +, -, (, ), and spaces
}

export function sanitizeSlug(slug: string): string {
  return sanitizeInput(slug, {
    allowedTags: [],
    allowedAttributes: {},
    stripHtml: true,
    maxLength: 100,
    trimWhitespace: true
  }).toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Object sanitization for nested data
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldConfigs: Record<keyof T, SanitizationOptions>
): T {
  const sanitized = { ...obj };

  for (const [key, config] of Object.entries(fieldConfigs)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key], config) as T[keyof T];
    }
  }

  return sanitized;
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitizeEmail(email));
}

export function isValidUrl(url: string): boolean {
  const sanitized = sanitizeUrl(url);
  return sanitized.length > 0;
}

export function isValidSlug(slug: string): boolean {
  const sanitized = sanitizeSlug(slug);
  return sanitized.length > 0 && /^[a-z0-9\-_]+$/.test(sanitized);
}

// XSS protection helpers
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeAttribute(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

