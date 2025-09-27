/**
 * Business Rules Module Exports
 * 
 * Centralized exports for the business rules system.
 */

export * from './validation';
export * from './middleware';

// Re-export commonly used functions for convenience
export {
  BusinessRules,
  ProductBusinessRules,
  OrderBusinessRules,
  CategoryBusinessRules,
  TenantBusinessRules,
  CartBusinessRules,
} from './validation';

export {
  withBusinessRule,
  withProductCreationRules,
  withProductUpdateRules,
  withCategoryCreationRules,
  withCategoryDeletionRules,
  withOrderCreationRules,
  withCartItemRules,
  validateBusinessRule,
} from './middleware';

