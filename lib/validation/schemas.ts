/**
 * Comprehensive Data Validation Schemas
 * 
 * Centralized validation schemas for all data models using Zod.
 * These schemas ensure data integrity and consistency across the application.
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').max(254, 'Email too long');
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional();
const urlSchema = z.string().url('Invalid URL').optional();
const slugSchema = z.string().regex(/^[a-z0-9\-_]+$/, 'Invalid slug format').min(1).max(100);
const idSchema = z.string().min(1, 'ID is required');
const timestampSchema = z.string().datetime().optional();

// User and Authentication Schemas
export const UserSchema = z.object({
  id: idSchema,
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: phoneSchema,
  role: z.enum(['customer', 'admin', 'owner']).default('customer'),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastLoginAt: timestampSchema,
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Tenant Schemas
export const TenantSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1, 'Tenant name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  logoUrl: urlSchema,
  websiteUrl: urlSchema,
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('active'),
  plan: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
  settings: z.record(z.any()).optional(),
  ownerId: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  subscriptionExpiresAt: timestampSchema,
});

export const CreateTenantSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTenantSchema = CreateTenantSchema.partial();

// Product Schemas
export const ProductSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  price: z.number().min(0, 'Price must be positive').max(999999.99, 'Price too high'),
  compareAtPrice: z.number().min(0).max(999999.99).optional(),
  costPrice: z.number().min(0).max(999999.99).optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  barcode: z.string().max(100, 'Barcode too long').optional(),
  weight: z.number().min(0).max(999999.99).optional(),
  dimensions: z.object({
    length: z.number().min(0).max(999999.99).optional(),
    width: z.number().min(0).max(999999.99).optional(),
    height: z.number().min(0).max(999999.99).optional(),
  }).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  inventory: z.object({
    trackQuantity: z.boolean().default(false),
    quantity: z.number().int().min(0).default(0),
    allowBackorder: z.boolean().default(false),
    lowStockThreshold: z.number().int().min(0).default(5),
  }).optional(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    alt: z.string().max(200, 'Alt text too long').optional(),
    isPrimary: z.boolean().default(false),
  })).default([]),
  categories: z.array(idSchema).default([]),
  tags: z.array(z.string().max(50)).default([]),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  seo: z.object({
    title: z.string().max(60, 'SEO title too long').optional(),
    description: z.string().max(160, 'SEO description too long').optional(),
    keywords: z.array(z.string().max(50)).default([]),
  }).optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Category Schemas
export const CategorySchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  slug: slugSchema,
  parentId: idSchema.optional(),
  imageUrl: urlSchema,
  status: z.enum(['active', 'inactive']).default('active'),
  sortOrder: z.number().int().min(0).default(0),
  seo: z.object({
    title: z.string().max(60, 'SEO title too long').optional(),
    description: z.string().max(160, 'SEO description too long').optional(),
    keywords: z.array(z.string().max(50)).default([]),
  }).optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Order Schemas
export const OrderItemSchema = z.object({
  productId: idSchema,
  variantId: idSchema.optional(),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  total: z.number().min(0, 'Total must be positive'),
  imageUrl: urlSchema.optional(),
});

export const OrderSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  customerId: idSchema.optional(),
  orderNumber: z.string().min(1, 'Order number is required').max(50, 'Order number too long'),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).default('pending'),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).default('pending'),
  fulfillmentStatus: z.enum(['unfulfilled', 'partial', 'fulfilled']).default('unfulfilled'),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  taxAmount: z.number().min(0, 'Tax amount must be positive').default(0),
  shippingAmount: z.number().min(0, 'Shipping amount must be positive').default(0),
  discountAmount: z.number().min(0, 'Discount amount must be positive').default(0),
  total: z.number().min(0, 'Total must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  customer: z.object({
    email: emailSchema,
    name: z.string().min(1, 'Customer name is required'),
    phone: phoneSchema,
  }),
  shippingAddress: z.object({
    name: z.string().min(1, 'Shipping name is required'),
    company: z.string().optional(),
    address1: z.string().min(1, 'Address is required'),
    address2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(2, 'Country is required').max(2, 'Country must be 2 characters'),
    phone: phoneSchema,
  }),
  billingAddress: z.object({
    name: z.string().min(1, 'Billing name is required'),
    company: z.string().optional(),
    address1: z.string().min(1, 'Address is required'),
    address2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(2, 'Country is required').max(2, 'Country must be 2 characters'),
    phone: phoneSchema,
  }),
  notes: z.string().max(1000, 'Notes too long').optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  shippedAt: timestampSchema,
  deliveredAt: timestampSchema,
});

export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shippedAt: true,
  deliveredAt: true,
});

export const UpdateOrderSchema = CreateOrderSchema.partial();

// Cart Schemas
export const CartItemSchema = z.object({
  productId: idSchema,
  variantId: idSchema.optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  addedAt: timestampSchema,
});

export const CartSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  customerId: idSchema.optional(),
  sessionId: z.string().optional(),
  items: z.array(CartItemSchema).default([]),
  expiresAt: timestampSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const CreateCartSchema = CartSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCartSchema = CreateCartSchema.partial();

// Settings Schemas
export const SocialLinksSchema = z.object({
  facebook: urlSchema,
  instagram: urlSchema,
  twitter: urlSchema,
  youtube: urlSchema,
  tiktok: urlSchema,
  linkedin: urlSchema,
  snapchat: urlSchema,
  whatsapp: z.string().optional(),
});

export const StoreSettingsSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  logoUrl: urlSchema,
  faviconUrl: urlSchema,
  websiteUrl: urlSchema,
  social: SocialLinksSchema.optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  timezone: z.string().default('UTC'),
  language: z.string().length(2, 'Language must be 2 characters').default('en'),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#000000'),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#666666'),
    fontFamily: z.string().max(100).default('Inter'),
  }).optional(),
  checkout: z.object({
    requireShippingAddress: z.boolean().default(true),
    requireBillingAddress: z.boolean().default(true),
    allowGuestCheckout: z.boolean().default(true),
    autoFulfillment: z.boolean().default(false),
  }).optional(),
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(false),
  }).optional(),
});

export const CreateStoreSettingsSchema = StoreSettingsSchema;
export const UpdateStoreSettingsSchema = StoreSettingsSchema.partial();

// API Request/Response Schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const ApiResponseSchema = z.object({
  ok: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }).optional(),
});

// Search and Filter Schemas
export const ProductFiltersSchema = z.object({
  categoryId: idSchema.optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100, 'Search term too long').optional(),
});

export const OrderFiltersSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).optional(),
  fulfillmentStatus: z.enum(['unfulfilled', 'partial', 'fulfilled']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  customerEmail: emailSchema.optional(),
  orderNumber: z.string().max(50).optional(),
});

// Validation helper functions
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateDataSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Export all schemas for easy importing
export const schemas = {
  // User schemas
  User: UserSchema,
  CreateUser: CreateUserSchema,
  UpdateUser: UpdateUserSchema,
  
  // Tenant schemas
  Tenant: TenantSchema,
  CreateTenant: CreateTenantSchema,
  UpdateTenant: UpdateTenantSchema,
  
  // Product schemas
  Product: ProductSchema,
  CreateProduct: CreateProductSchema,
  UpdateProduct: UpdateProductSchema,
  
  // Category schemas
  Category: CategorySchema,
  CreateCategory: CreateCategorySchema,
  UpdateCategory: UpdateCategorySchema,
  
  // Order schemas
  Order: OrderSchema,
  CreateOrder: CreateOrderSchema,
  UpdateOrder: UpdateOrderSchema,
  OrderItem: OrderItemSchema,
  
  // Cart schemas
  Cart: CartSchema,
  CreateCart: CreateCartSchema,
  UpdateCart: UpdateCartSchema,
  CartItem: CartItemSchema,
  
  // Settings schemas
  StoreSettings: StoreSettingsSchema,
  CreateStoreSettings: CreateStoreSettingsSchema,
  UpdateStoreSettings: UpdateStoreSettingsSchema,
  SocialLinks: SocialLinksSchema,
  
  // API schemas
  Pagination: PaginationSchema,
  ApiResponse: ApiResponseSchema,
  
  // Filter schemas
  ProductFilters: ProductFiltersSchema,
  OrderFilters: OrderFiltersSchema,
};

