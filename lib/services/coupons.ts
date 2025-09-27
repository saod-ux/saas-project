/**
 * Coupon and Discount Management Service
 * 
 * Handles coupon creation, validation, and application
 */

import { getTenantDocuments, createDocument, updateDocument, getDocument } from '@/lib/db';
import { log } from '@/lib/logger';

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number; // Percentage (0-100) or fixed amount
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Category IDs
  customerRestrictions?: {
    customerIds?: string[];
    newCustomersOnly?: boolean;
    existingCustomersOnly?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
  code?: string;
}

export interface OrderDiscount {
  couponId?: string;
  couponCode?: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  originalAmount: number;
  finalAmount: number;
  freeShipping: boolean;
}

export class CouponService {
  /**
   * Create a new coupon
   */
  static async createCoupon(
    tenantId: string,
    couponData: Omit<Coupon, 'id' | 'tenantId' | 'usedCount' | 'createdAt' | 'updatedAt'>
  ): Promise<Coupon> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'createCoupon', 
      tenantId, 
      code: couponData.code 
    });
    
    try {
      // Check if coupon code already exists
      const existingCoupons = await getTenantDocuments('coupons', tenantId);
      const codeExists = existingCoupons.some((c: any) => 
        c.code.toLowerCase() === couponData.code.toLowerCase()
      );
      
      if (codeExists) {
        throw new Error('Coupon code already exists');
      }

      const coupon: Coupon = {
        id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...couponData
      };

      await createDocument('coupons', coupon);
      
      logger.info('Coupon created successfully', { couponId: coupon.id });
      return coupon;
    } catch (error) {
      logger.error('Error creating coupon:', error);
      throw error;
    }
  }

  /**
   * Validate and apply a coupon to an order
   */
  static async validateCoupon(
    tenantId: string,
    couponCode: string,
    orderData: {
      subtotal: number;
      customerId?: string;
      items: Array<{
        productId: string;
        categoryId?: string;
        quantity: number;
        price: number;
      }>;
    }
  ): Promise<CouponValidationResult> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'validateCoupon', 
      tenantId, 
      couponCode 
    });
    
    try {
      // Find the coupon
      const coupons = await getTenantDocuments('coupons', tenantId);
      const coupon = coupons.find((c: any) => 
        c.code.toLowerCase() === couponCode.toLowerCase() && c.isActive
      );

      if (!coupon) {
        return {
          isValid: false,
          error: 'Invalid coupon code',
          code: 'INVALID_CODE'
        };
      }

      // Check if coupon is within validity period
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      if (now < validFrom) {
        return {
          isValid: false,
          error: 'Coupon is not yet valid',
          code: 'NOT_YET_VALID'
        };
      }

      if (now > validUntil) {
        return {
          isValid: false,
          error: 'Coupon has expired',
          code: 'EXPIRED'
        };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return {
          isValid: false,
          error: 'Coupon usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED'
        };
      }

      // Check minimum order amount
      if (coupon.minimumOrderAmount && orderData.subtotal < coupon.minimumOrderAmount) {
        return {
          isValid: false,
          error: `Minimum order amount of ${coupon.minimumOrderAmount} required`,
          code: 'MINIMUM_ORDER_NOT_MET'
        };
      }

      // Check customer restrictions
      if (coupon.customerRestrictions) {
        const { customerIds, newCustomersOnly, existingCustomersOnly } = coupon.customerRestrictions;
        
        if (customerIds && customerIds.length > 0 && orderData.customerId) {
          if (!customerIds.includes(orderData.customerId)) {
            return {
              isValid: false,
              error: 'Coupon not available for this customer',
              code: 'CUSTOMER_RESTRICTED'
            };
          }
        }

        // For new/existing customer restrictions, we'd need to check customer creation date
        // This is a simplified implementation
      }

      // Check product/category restrictions
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = orderData.items.some(item => 
          coupon.applicableProducts!.includes(item.productId)
        );
        
        if (!hasApplicableProduct) {
          return {
            isValid: false,
            error: 'Coupon not applicable to any items in cart',
            code: 'PRODUCT_RESTRICTED'
          };
        }
      }

      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        const hasApplicableCategory = orderData.items.some(item => 
          item.categoryId && coupon.applicableCategories!.includes(item.categoryId)
        );
        
        if (!hasApplicableCategory) {
          return {
            isValid: false,
            error: 'Coupon not applicable to any items in cart',
            code: 'CATEGORY_RESTRICTED'
          };
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      
      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (orderData.subtotal * coupon.value) / 100;
        
        // Apply maximum discount limit
        if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
          discountAmount = coupon.maximumDiscountAmount;
        }
      } else if (coupon.type === 'FIXED_AMOUNT') {
        discountAmount = Math.min(coupon.value, orderData.subtotal);
      } else if (coupon.type === 'FREE_SHIPPING') {
        // Free shipping is handled separately
        discountAmount = 0;
      }

      logger.info('Coupon validation successful', { 
        couponId: coupon.id, 
        discountAmount,
        type: coupon.type
      });

      return {
        isValid: true,
        coupon,
        discountAmount
      };
    } catch (error) {
      logger.error('Error validating coupon:', error);
      return {
        isValid: false,
        error: 'Failed to validate coupon',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Apply coupon to order and calculate final amounts
   */
  static async applyCouponToOrder(
    tenantId: string,
    couponCode: string,
    orderData: {
      subtotal: number;
      shippingCost: number;
      customerId?: string;
      items: Array<{
        productId: string;
        categoryId?: string;
        quantity: number;
        price: number;
      }>;
    }
  ): Promise<OrderDiscount> {
    const validation = await this.validateCoupon(tenantId, couponCode, orderData);
    
    if (!validation.isValid || !validation.coupon) {
      throw new Error(validation.error || 'Invalid coupon');
    }

    const coupon = validation.coupon;
    let discountAmount = validation.discountAmount || 0;
    let freeShipping = false;

    // Handle free shipping
    if (coupon.type === 'FREE_SHIPPING') {
      freeShipping = true;
      discountAmount = orderData.shippingCost;
    }

    const finalAmount = Math.max(0, orderData.subtotal + orderData.shippingCost - discountAmount);

    return {
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount,
      discountType: coupon.type,
      originalAmount: orderData.subtotal + orderData.shippingCost,
      finalAmount,
      freeShipping
    };
  }

  /**
   * Record coupon usage
   */
  static async recordCouponUsage(
    tenantId: string,
    couponId: string,
    orderId: string,
    customerId?: string
  ): Promise<void> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'recordCouponUsage', 
      tenantId, 
      couponId, 
      orderId 
    });
    
    try {
      // Update coupon usage count
      const coupon = await getDocument('coupons', couponId, tenantId);
      if (coupon) {
        await updateDocument('coupons', couponId, {
          usedCount: coupon.usedCount + 1,
          updatedAt: new Date().toISOString()
        }, tenantId);
      }

      // Record usage in separate collection for analytics
      const usageRecord = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        couponId,
        orderId,
        customerId,
        usedAt: new Date().toISOString()
      };

      await createDocument('couponUsage', usageRecord);
      
      logger.info('Coupon usage recorded', { couponId, orderId });
    } catch (error) {
      logger.error('Error recording coupon usage:', error);
      throw error;
    }
  }

  /**
   * Get all coupons for a tenant
   */
  static async getCoupons(
    tenantId: string,
    filters: {
      isActive?: boolean;
      type?: string;
    } = {}
  ): Promise<Coupon[]> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'getCoupons', 
      tenantId, 
      filters 
    });
    
    try {
      const coupons = await getTenantDocuments('coupons', tenantId);
      
      let filteredCoupons = coupons;
      
      if (filters.isActive !== undefined) {
        filteredCoupons = filteredCoupons.filter((c: any) => c.isActive === filters.isActive);
      }
      
      if (filters.type) {
        filteredCoupons = filteredCoupons.filter((c: any) => c.type === filters.type);
      }

      // Sort by creation date (newest first)
      filteredCoupons.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.info('Retrieved coupons', { count: filteredCoupons.length });
      return filteredCoupons;
    } catch (error) {
      logger.error('Error getting coupons:', error);
      throw error;
    }
  }

  /**
   * Update coupon
   */
  static async updateCoupon(
    tenantId: string,
    couponId: string,
    updates: Partial<Coupon>
  ): Promise<Coupon> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'updateCoupon', 
      tenantId, 
      couponId 
    });
    
    try {
      const updatedCoupon = await updateDocument('coupons', couponId, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, tenantId);

      logger.info('Coupon updated successfully', { couponId });
      return updatedCoupon;
    } catch (error) {
      logger.error('Error updating coupon:', error);
      throw error;
    }
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(tenantId: string, couponId: string): Promise<void> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'deleteCoupon', 
      tenantId, 
      couponId 
    });
    
    try {
      // Instead of deleting, mark as inactive
      await updateDocument('coupons', couponId, {
        isActive: false,
        updatedAt: new Date().toISOString()
      }, tenantId);

      logger.info('Coupon deactivated successfully', { couponId });
    } catch (error) {
      logger.error('Error deleting coupon:', error);
      throw error;
    }
  }

  /**
   * Get coupon analytics
   */
  static async getCouponAnalytics(tenantId: string): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscountGiven: number;
    topCoupons: Array<{
      couponId: string;
      code: string;
      usageCount: number;
      discountGiven: number;
    }>;
  }> {
    const logger = log.child({ 
      service: 'CouponService', 
      method: 'getCouponAnalytics', 
      tenantId 
    });
    
    try {
      const [coupons, usageRecords] = await Promise.all([
        getTenantDocuments('coupons', tenantId),
        getTenantDocuments('couponUsage', tenantId)
      ]);

      const totalCoupons = coupons.length;
      const activeCoupons = coupons.filter((c: any) => c.isActive).length;
      const totalUsage = usageRecords.length;

      // Calculate total discount given (simplified)
      const totalDiscountGiven = coupons.reduce((sum: number, coupon: any) => 
        sum + (coupon.usedCount * (coupon.value || 0)), 0
      );

      // Get top coupons by usage
      const topCoupons = coupons
        .filter((c: any) => c.usedCount > 0)
        .sort((a: any, b: any) => b.usedCount - a.usedCount)
        .slice(0, 5)
        .map((coupon: any) => ({
          couponId: coupon.id,
          code: coupon.code,
          usageCount: coupon.usedCount,
          discountGiven: coupon.usedCount * (coupon.value || 0)
        }));

      const analytics = {
        totalCoupons,
        activeCoupons,
        totalUsage,
        totalDiscountGiven,
        topCoupons
      };

      logger.info('Generated coupon analytics', analytics);
      return analytics;
    } catch (error) {
      logger.error('Error getting coupon analytics:', error);
      throw error;
    }
  }
}

