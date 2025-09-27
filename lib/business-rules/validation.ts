/**
 * Business Logic Validation and Constraints
 * 
 * Implements business rules and constraints that go beyond basic data validation.
 * These rules enforce domain-specific logic and business requirements.
 */

import { z } from 'zod';
import { getTenantBySlug } from '@/lib/services/tenant';
import { getTenantDocuments } from '@/lib/firebase/tenant';

// Business rule validation results
export interface BusinessRuleResult {
  valid: boolean;
  error?: string;
  code?: string;
  details?: any;
}

// Product business rules
export class ProductBusinessRules {
  static async validateProductCreation(
    tenantId: string,
    productData: any
  ): Promise<BusinessRuleResult> {
    // Rule 1: Check if tenant has reached product limit
    const tenant = await getTenantBySlug(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found', code: 'TENANT_NOT_FOUND' };
    }

    const existingProducts = await getTenantDocuments('products', tenantId);
    const productLimit = this.getProductLimit(tenant.plan);
    
    if (existingProducts.length >= productLimit) {
      return { 
        valid: false, 
        error: `Product limit reached. Maximum ${productLimit} products allowed for ${tenant.plan} plan.`,
        code: 'PRODUCT_LIMIT_EXCEEDED',
        details: { current: existingProducts.length, limit: productLimit, plan: tenant.plan }
      };
    }

    // Rule 2: Check for duplicate SKU within tenant
    if (productData.sku) {
      const duplicateSku = existingProducts.find((p: any) => p.sku === productData.sku);
      if (duplicateSku) {
        return { 
          valid: false, 
          error: 'SKU already exists', 
          code: 'DUPLICATE_SKU',
          details: { sku: productData.sku, existingProductId: duplicateSku.id }
        };
      }
    }

    // Rule 3: Validate price constraints
    if (productData.price <= 0) {
      return { valid: false, error: 'Price must be greater than 0', code: 'INVALID_PRICE' };
    }

    if (productData.compareAtPrice && productData.compareAtPrice <= productData.price) {
      return { 
        valid: false, 
        error: 'Compare at price must be greater than regular price', 
        code: 'INVALID_COMPARE_PRICE' 
      };
    }

    // Rule 4: Validate inventory constraints
    if (productData.inventory?.trackQuantity) {
      if (productData.inventory.quantity < 0) {
        return { valid: false, error: 'Inventory quantity cannot be negative', code: 'INVALID_INVENTORY' };
      }
      
      if (productData.inventory.lowStockThreshold < 0) {
        return { valid: false, error: 'Low stock threshold cannot be negative', code: 'INVALID_LOW_STOCK_THRESHOLD' };
      }
    }

    // Rule 5: Validate category exists and belongs to tenant
    if (productData.categories && productData.categories.length > 0) {
      const categories = await getTenantDocuments('categories', tenantId);
      const validCategoryIds = categories.map((c: any) => c.id);
      
      for (const categoryId of productData.categories) {
        if (!validCategoryIds.includes(categoryId)) {
          return { 
            valid: false, 
            error: `Category ${categoryId} does not exist or does not belong to this tenant`, 
            code: 'INVALID_CATEGORY' 
          };
        }
      }
    }

    return { valid: true };
  }

  static async validateProductUpdate(
    tenantId: string,
    productId: string,
    updateData: any
  ): Promise<BusinessRuleResult> {
    // Rule 1: Check if product exists and belongs to tenant
    const products = await getTenantDocuments('products', tenantId);
    const product = products.find((p: any) => p.id === productId);
    
    if (!product) {
      return { valid: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' };
    }

    // Rule 2: Check for duplicate SKU (excluding current product)
    if (updateData.sku && updateData.sku !== product.sku) {
      const duplicateSku = products.find((p: any) => p.sku === updateData.sku && p.id !== productId);
      if (duplicateSku) {
        return { 
          valid: false, 
          error: 'SKU already exists', 
          code: 'DUPLICATE_SKU',
          details: { sku: updateData.sku, existingProductId: duplicateSku.id }
        };
      }
    }

    // Rule 3: Validate price constraints
    if (updateData.price !== undefined && updateData.price <= 0) {
      return { valid: false, error: 'Price must be greater than 0', code: 'INVALID_PRICE' };
    }

    const finalPrice = updateData.price !== undefined ? updateData.price : product.price;
    const finalComparePrice = updateData.compareAtPrice !== undefined ? updateData.compareAtPrice : product.compareAtPrice;
    
    if (finalComparePrice && finalComparePrice <= finalPrice) {
      return { 
        valid: false, 
        error: 'Compare at price must be greater than regular price', 
        code: 'INVALID_COMPARE_PRICE' 
      };
    }

    return { valid: true };
  }

  private static getProductLimit(plan: string): number {
    const limits = {
      free: 10,
      basic: 100,
      premium: 1000,
      enterprise: 10000
    };
    return limits[plan as keyof typeof limits] || limits.free;
  }
}

// Order business rules
export class OrderBusinessRules {
  static async validateOrderCreation(
    tenantId: string,
    orderData: any
  ): Promise<BusinessRuleResult> {
    // Rule 1: Validate all products exist and are active
    const products = await getTenantDocuments('products', tenantId);
    const activeProducts = products.filter((p: any) => p.status === 'active');
    const productIds = activeProducts.map((p: any) => p.id);

    for (const item of orderData.items) {
      if (!productIds.includes(item.productId)) {
        return { 
          valid: false, 
          error: `Product ${item.productId} not found or inactive`, 
          code: 'INVALID_PRODUCT' 
        };
      }

      // Rule 2: Check inventory availability
      const product = activeProducts.find((p: any) => p.id === item.productId);
      if (product?.inventory?.trackQuantity && !product?.inventory?.allowBackorder) {
        if (product.inventory.quantity < item.quantity) {
          return { 
            valid: false, 
            error: `Insufficient inventory for product ${product.name}. Available: ${product.inventory.quantity}, Requested: ${item.quantity}`, 
            code: 'INSUFFICIENT_INVENTORY',
            details: { productId: item.productId, available: product.inventory.quantity, requested: item.quantity }
          };
        }
      }

      // Rule 3: Validate quantity
      if (item.quantity <= 0) {
        return { valid: false, error: 'Item quantity must be greater than 0', code: 'INVALID_QUANTITY' };
      }
    }

    // Rule 4: Validate order total
    const calculatedTotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const expectedTotal = calculatedTotal + (orderData.taxAmount || 0) + (orderData.shippingAmount || 0) - (orderData.discountAmount || 0);
    
    if (Math.abs(orderData.total - expectedTotal) > 0.01) { // Allow for small floating point differences
      return { 
        valid: false, 
        error: 'Order total does not match calculated total', 
        code: 'INVALID_ORDER_TOTAL',
        details: { provided: orderData.total, calculated: expectedTotal }
      };
    }

    return { valid: true };
  }

  static async validateOrderStatusTransition(
    currentStatus: string,
    newStatus: string
  ): Promise<BusinessRuleResult> {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return { 
        valid: false, 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`, 
        code: 'INVALID_STATUS_TRANSITION',
        details: { currentStatus, newStatus, validTransitions: validTransitions[currentStatus] }
      };
    }

    return { valid: true };
  }
}

// Category business rules
export class CategoryBusinessRules {
  static async validateCategoryCreation(
    tenantId: string,
    categoryData: any
  ): Promise<BusinessRuleResult> {
    // Rule 1: Check for duplicate slug within tenant
    const categories = await getTenantDocuments('categories', tenantId);
    const duplicateSlug = categories.find((c: any) => c.slug === categoryData.slug);
    
    if (duplicateSlug) {
      return { 
        valid: false, 
        error: 'Category slug already exists', 
        code: 'DUPLICATE_SLUG',
        details: { slug: categoryData.slug, existingCategoryId: duplicateSlug.id }
      };
    }

    // Rule 2: Validate parent category exists and belongs to tenant
    if (categoryData.parentId) {
      const parentCategory = categories.find((c: any) => c.id === categoryData.parentId);
      if (!parentCategory) {
        return { 
          valid: false, 
          error: 'Parent category not found', 
          code: 'PARENT_CATEGORY_NOT_FOUND' 
        };
      }

      // Rule 3: Prevent circular references
      if (this.wouldCreateCircularReference(categories, categoryData.parentId, categoryData.id)) {
        return { 
          valid: false, 
          error: 'Cannot create circular reference in category hierarchy', 
          code: 'CIRCULAR_REFERENCE' 
        };
      }
    }

    return { valid: true };
  }

  static async validateCategoryDeletion(
    tenantId: string,
    categoryId: string
  ): Promise<BusinessRuleResult> {
    // Rule 1: Check if category has child categories
    const categories = await getTenantDocuments('categories', tenantId);
    const childCategories = categories.filter((c: any) => c.parentId === categoryId);
    
    if (childCategories.length > 0) {
      return { 
        valid: false, 
        error: 'Cannot delete category with child categories', 
        code: 'HAS_CHILD_CATEGORIES',
        details: { childCount: childCategories.length, childIds: childCategories.map((c: any) => c.id) }
      };
    }

    // Rule 2: Check if category has products
    const products = await getTenantDocuments('products', tenantId);
    const productsInCategory = products.filter((p: any) => 
      p.categories && p.categories.includes(categoryId)
    );
    
    if (productsInCategory.length > 0) {
      return { 
        valid: false, 
        error: 'Cannot delete category with products', 
        code: 'HAS_PRODUCTS',
        details: { productCount: productsInCategory.length, productIds: productsInCategory.map((p: any) => p.id) }
      };
    }

    return { valid: true };
  }

  private static wouldCreateCircularReference(
    categories: any[],
    parentId: string,
    categoryId: string
  ): boolean {
    let currentParentId = parentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected
      }
      
      if (currentParentId === categoryId) {
        return true; // Would create circular reference
      }
      
      visited.add(currentParentId);
      const parent = categories.find((c: any) => c.id === currentParentId);
      currentParentId = parent?.parentId;
    }
    
    return false;
  }
}

// Tenant business rules
export class TenantBusinessRules {
  static async validateTenantSlug(slug: string): Promise<BusinessRuleResult> {
    // Rule 1: Check for reserved slugs
    const reservedSlugs = [
      'admin', 'api', 'app', 'www', 'mail', 'ftp', 'blog', 'shop', 'store',
      'support', 'help', 'docs', 'status', 'dashboard', 'login', 'signup',
      'register', 'account', 'profile', 'settings', 'billing', 'payment'
    ];
    
    if (reservedSlugs.includes(slug.toLowerCase())) {
      return { 
        valid: false, 
        error: 'This slug is reserved and cannot be used', 
        code: 'RESERVED_SLUG',
        details: { slug, reservedSlugs }
      };
    }

    // Rule 2: Check for existing tenant with same slug
    const existingTenant = await getTenantBySlug(slug);
    if (existingTenant) {
      return { 
        valid: false, 
        error: 'Tenant slug already exists', 
        code: 'DUPLICATE_SLUG',
        details: { slug, existingTenantId: existingTenant.id }
      };
    }

    return { valid: true };
  }

  static async validatePlanUpgrade(
    currentPlan: string,
    newPlan: string
  ): Promise<BusinessRuleResult> {
    const planHierarchy = ['free', 'basic', 'premium', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    const newIndex = planHierarchy.indexOf(newPlan);
    
    if (currentIndex === -1 || newIndex === -1) {
      return { valid: false, error: 'Invalid plan', code: 'INVALID_PLAN' };
    }
    
    if (newIndex < currentIndex) {
      return { 
        valid: false, 
        error: 'Cannot downgrade plan directly. Contact support for assistance.', 
        code: 'PLAN_DOWNGRADE_NOT_ALLOWED' 
      };
    }
    
    return { valid: true };
  }
}

// Cart business rules
export class CartBusinessRules {
  static async validateCartItem(
    tenantId: string,
    productId: string,
    quantity: number
  ): Promise<BusinessRuleResult> {
    // Rule 1: Check if product exists and is active
    const products = await getTenantDocuments('products', tenantId);
    const product = products.find((p: any) => p.id === productId && p.status === 'active');
    
    if (!product) {
      return { valid: false, error: 'Product not found or inactive', code: 'INVALID_PRODUCT' };
    }

    // Rule 2: Check inventory availability
    if (product.inventory?.trackQuantity && !product.inventory?.allowBackorder) {
      if (product.inventory.quantity < quantity) {
        return { 
          valid: false, 
          error: 'Insufficient inventory', 
          code: 'INSUFFICIENT_INVENTORY',
          details: { available: product.inventory.quantity, requested: quantity }
        };
      }
    }

    // Rule 3: Validate quantity
    if (quantity <= 0) {
      return { valid: false, error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' };
    }

    // Rule 4: Check maximum quantity per item
    const maxQuantity = 100; // Business rule: max 100 of any single item
    if (quantity > maxQuantity) {
      return { 
        valid: false, 
        error: `Maximum quantity per item is ${maxQuantity}`, 
        code: 'QUANTITY_EXCEEDED',
        details: { maxQuantity, requested: quantity }
      };
    }

    return { valid: true };
  }
}

// Export all business rule classes
export const BusinessRules = {
  Product: ProductBusinessRules,
  Order: OrderBusinessRules,
  Category: CategoryBusinessRules,
  Tenant: TenantBusinessRules,
  Cart: CartBusinessRules,
};

