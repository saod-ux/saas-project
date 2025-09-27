/**
 * Validation Middleware
 * 
 * Provides middleware functions to validate request data using Zod schemas
 * and return standardized error responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { badRequest } from '@/lib/http/responses';
import { logger, createRequestContext } from '@/lib/logging';

export interface ValidationOptions {
  schema: z.ZodSchema;
  source?: 'body' | 'query' | 'params' | 'headers';
  allowPartial?: boolean;
  stripUnknown?: boolean;
}

export function withValidation<T extends any[]>(
  options: ValidationOptions
) {
  const { schema, source = 'body', allowPartial = false, stripUnknown = true } = options;

  return function(
    handler: (request: NextRequest, validatedData: any, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const context = createRequestContext(request);
      
      try {
        let rawData: any;

        // Extract data from the specified source
        switch (source) {
          case 'body':
            try {
              rawData = await request.json();
            } catch (error) {
              logger.warn('Invalid JSON in request body', { ...context });
              return badRequest('Invalid JSON in request body');
            }
            break;
          
          case 'query':
            rawData = Object.fromEntries(request.nextUrl.searchParams);
            break;
          
          case 'params':
            rawData = args[0] || {};
            break;
          
          case 'headers':
            rawData = Object.fromEntries(request.headers.entries());
            break;
          
          default:
            rawData = {};
        }

        // Apply schema validation
        let validationSchema = schema;
        
        if (allowPartial) {
          validationSchema = schema.partial();
        }
        
        if (stripUnknown) {
          validationSchema = validationSchema.strict();
        }

        const validatedData = validationSchema.parse(rawData);

        // Call the original handler with validated data
        return await handler(request, validatedData, ...args);
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));

          logger.warn('Validation failed', { 
            ...context, 
            validationErrors,
            source
          });

          return badRequest('Validation failed', { 
            details: validationErrors,
            code: 'VALIDATION_ERROR'
          });
        }

        logger.error('Validation middleware error', context, error instanceof Error ? error : new Error(String(error)));
        return badRequest('Validation error');
      }
    };
  };
}

// Convenience functions for common validation scenarios
export const validateBody = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'body' });

export const validateQuery = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'query' });

export const validateParams = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'params' });

export const validateHeaders = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'headers' });

// Partial validation (for PATCH requests)
export const validateBodyPartial = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'body', allowPartial: true });

export const validateQueryPartial = <T extends z.ZodSchema>(schema: T) => 
  withValidation({ schema, source: 'query', allowPartial: true });

// Validation with custom error handling
export function withCustomValidation<T extends any[]>(
  options: ValidationOptions & {
    onError?: (error: z.ZodError, context: any) => NextResponse;
  }
) {
  const { onError, ...validationOptions } = options;

  return function(
    handler: (request: NextRequest, validatedData: any, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const context = createRequestContext(request);
      
      try {
        let rawData: any;

        switch (validationOptions.source) {
          case 'body':
            try {
              rawData = await request.json();
            } catch (error) {
              return badRequest('Invalid JSON in request body');
            }
            break;
          case 'query':
            rawData = Object.fromEntries(request.nextUrl.searchParams);
            break;
          case 'params':
            rawData = args[0] || {};
            break;
          case 'headers':
            rawData = Object.fromEntries(request.headers.entries());
            break;
          default:
            rawData = {};
        }

        const validatedData = validationOptions.schema.parse(rawData);
        return await handler(request, validatedData, ...args);
        
      } catch (error) {
        if (error instanceof z.ZodError && onError) {
          return onError(error, context);
        }
        
        // Fall back to default error handling
        return withValidation(validationOptions)(handler)(request, ...args);
      }
    };
  };
}

// Utility function to validate data in route handlers
export async function validateRequestData<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'params' | 'headers' = 'body'
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    let rawData: any;

    switch (source) {
      case 'body':
        try {
          rawData = await request.json();
        } catch (error) {
          return { 
            success: false, 
            response: badRequest('Invalid JSON in request body') 
          };
        }
        break;
      case 'query':
        rawData = Object.fromEntries(request.nextUrl.searchParams);
        break;
      case 'params':
        rawData = {};
        break;
      case 'headers':
        rawData = Object.fromEntries(request.headers.entries());
        break;
    }

    const validatedData = schema.parse(rawData);
    return { success: true, data: validatedData };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        received: err.received
      }));

      return {
        success: false,
        response: badRequest('Validation failed', { 
          details: validationErrors,
          code: 'VALIDATION_ERROR'
        })
      };
    }

    return {
      success: false,
      response: badRequest('Validation error')
    };
  }
}
