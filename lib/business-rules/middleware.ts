/**
 * Business Rules Middleware
 * 
 * Provides middleware functions to apply business rules validation
 * to API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BusinessRules, BusinessRuleResult } from './validation';
import { badRequest } from '@/lib/http/responses';
import { logger, createRequestContext } from '@/lib/logging';

export interface BusinessRuleOptions {
  rule: (data: any, context: any) => Promise<BusinessRuleResult>;
  contextExtractor?: (request: NextRequest, ...args: any[]) => any;
}

export function withBusinessRule<T extends any[]>(
  options: BusinessRuleOptions
) {
  const { rule, contextExtractor } = options;

  return function(
    handler: (request: NextRequest, validatedData: any, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, validatedData: any, ...args: T): Promise<NextResponse> => {
      const context = createRequestContext(request);
      
      try {
        // Extract context for business rule validation
        const ruleContext = contextExtractor ? contextExtractor(request, ...args) : {};

        // Apply business rule
        const ruleResult = await rule(validatedData, ruleContext);

        if (!ruleResult.valid) {
          logger.warn('Business rule validation failed', { 
            ...context, 
            ruleError: ruleResult.error,
            ruleCode: ruleResult.code,
            ruleDetails: ruleResult.details
          });

          return badRequest(ruleResult.error || 'Business rule validation failed', {
            code: ruleResult.code,
            details: ruleResult.details
          });
        }

        // Call the original handler
        return await handler(request, validatedData, ...args);
        
      } catch (error) {
        logger.error('Business rule middleware error', context, error instanceof Error ? error : new Error(String(error)));
        return badRequest('Business rule validation error');
      }
    };
  };
}

// Convenience functions for common business rule scenarios
export const withProductCreationRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Product.validateProductCreation(context.tenantId, data);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug };
  }
});

export const withProductUpdateRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Product.validateProductUpdate(context.tenantId, context.productId, data);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug, productId: params.id };
  }
});

export const withCategoryCreationRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Category.validateCategoryCreation(context.tenantId, data);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug };
  }
});

export const withCategoryDeletionRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Category.validateCategoryDeletion(context.tenantId, context.categoryId);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug, categoryId: params.id };
  }
});

export const withOrderCreationRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Order.validateOrderCreation(context.tenantId, data);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug };
  }
});

export const withCartItemRules = withBusinessRule({
  rule: async (data: any, context: any) => {
    return BusinessRules.Cart.validateCartItem(context.tenantId, data.productId, data.quantity);
  },
  contextExtractor: (request: NextRequest, ...args: any[]) => {
    const params = args[0]?.params || {};
    return { tenantId: params.tenantSlug };
  }
});

// Utility function to apply business rules in route handlers
export async function validateBusinessRule(
  rule: (data: any, context: any) => Promise<BusinessRuleResult>,
  data: any,
  context: any
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  try {
    const result = await rule(data, context);
    
    if (!result.valid) {
      return {
        success: false,
        response: badRequest(result.error || 'Business rule validation failed', {
          code: result.code,
          details: result.details
        })
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      response: badRequest('Business rule validation error')
    };
  }
}

