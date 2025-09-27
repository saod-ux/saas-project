import { z } from 'zod';

// Order Status Enum
export const OrderStatus = z.enum([
  'pending',      // Order created, awaiting payment
  'paid',         // Payment confirmed
  'processing',   // Order being prepared
  'shipped',      // Order shipped
  'delivered',    // Order delivered
  'cancelled',    // Order cancelled
  'refunded'      // Order refunded
]);

export type OrderStatus = z.infer<typeof OrderStatus>;

// Shipping Address Schema
export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

// Order Item Schema
export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  nameAr: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  total: z.number().min(0, 'Total must be non-negative'),
  image: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// Payment Information Schema
export const PaymentInfoSchema = z.object({
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
  provider: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number().min(0, 'Payment amount must be non-negative'),
  currency: z.string().default('KWD'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
  processedAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;

// Shipping Information Schema
export const ShippingInfoSchema = z.object({
  method: z.string().min(1, 'Shipping method is required'),
  cost: z.number().min(0, 'Shipping cost must be non-negative'),
  estimatedDays: z.number().int().min(1, 'Estimated days must be at least 1'),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

export type ShippingInfo = z.infer<typeof ShippingInfoSchema>;

// Order Schema
export const OrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().optional(),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().optional(),
  
  // Order Items
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  
  // Pricing
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  taxAmount: z.number().min(0, 'Tax amount must be non-negative').default(0),
  shippingCost: z.number().min(0, 'Shipping cost must be non-negative').default(0),
  discountAmount: z.number().min(0, 'Discount amount must be non-negative').default(0),
  total: z.number().min(0, 'Total must be non-negative'),
  
  // Status and Dates
  status: OrderStatus.default('pending'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  
  // Addresses
  shippingAddress: ShippingAddressSchema,
  billingAddress: ShippingAddressSchema.optional(),
  
  // Payment and Shipping
  payment: PaymentInfoSchema,
  shipping: ShippingInfoSchema,
  
  // Additional Information
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  
  // Audit fields
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

// Order Creation Schema (for API requests)
export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});

export type CreateOrder = z.infer<typeof CreateOrderSchema>;

// Order Update Schema (for API requests)
export const UpdateOrderSchema = OrderSchema.partial().omit({
  id: true,
  orderNumber: true,
  tenantId: true,
  customerId: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// Order Query Schema (for filtering and pagination)
export const OrderQuerySchema = z.object({
  status: OrderStatus.optional(),
  customerId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrderQuery = z.infer<typeof OrderQuerySchema>;

// Order Summary Schema (for list views)
export const OrderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerEmail: z.string(),
  status: OrderStatus,
  total: z.number(),
  itemCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

