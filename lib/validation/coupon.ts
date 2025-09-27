import { z } from 'zod';

export const CreateCouponSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Coupon code can only contain letters, numbers, hyphens, and underscores'),
  name: z.string()
    .min(1, 'Coupon name is required')
    .max(100, 'Coupon name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Invalid coupon type' })
  }),
  value: z.number()
    .positive('Value must be positive')
    .refine((val, ctx) => {
      const type = ctx.parent?.type;
      if (type === 'PERCENTAGE' && val > 100) {
        return false;
      }
      return true;
    }, 'Percentage value cannot exceed 100%'),
  minimumOrderAmount: z.number()
    .positive('Minimum order amount must be positive')
    .optional(),
  maximumDiscountAmount: z.number()
    .positive('Maximum discount amount must be positive')
    .optional(),
  usageLimit: z.number()
    .int('Usage limit must be an integer')
    .positive('Usage limit must be positive')
    .optional(),
  isActive: z.boolean().default(true),
  validFrom: z.string()
    .datetime('Invalid valid from date')
    .refine((date) => new Date(date) >= new Date(), 'Valid from date must be in the future'),
  validUntil: z.string()
    .datetime('Invalid valid until date'),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  customerRestrictions: z.object({
    customerIds: z.array(z.string()).optional(),
    newCustomersOnly: z.boolean().optional(),
    existingCustomersOnly: z.boolean().optional(),
  }).optional(),
}).refine((data) => {
  // Ensure valid until is after valid from
  return new Date(data.validUntil) > new Date(data.validFrom);
}, {
  message: 'Valid until date must be after valid from date',
  path: ['validUntil']
}).refine((data) => {
  // Ensure maximum discount amount is only set for percentage coupons
  if (data.maximumDiscountAmount && data.type !== 'PERCENTAGE') {
    return false;
  }
  return true;
}, {
  message: 'Maximum discount amount can only be set for percentage coupons',
  path: ['maximumDiscountAmount']
});

export const UpdateCouponSchema = CreateCouponSchema.partial().extend({
  id: z.string().min(1, 'Coupon ID is required'),
});

export const ValidateCouponSchema = z.object({
  couponCode: z.string()
    .min(1, 'Coupon code is required')
    .max(20, 'Coupon code must be at most 20 characters'),
  orderData: z.object({
    subtotal: z.number().positive('Subtotal must be positive'),
    shippingCost: z.number().min(0, 'Shipping cost cannot be negative'),
    customerId: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      categoryId: z.string().optional(),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
      price: z.number().positive('Price must be positive'),
    })).min(1, 'Order must contain at least one item'),
  }),
});

export const CouponUsageSchema = z.object({
  couponId: z.string().min(1, 'Coupon ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().optional(),
});

