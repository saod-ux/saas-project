import { z } from 'zod'

// Product validation schemas
export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  currency: z.string().default('KWD'), // Changed to KWD
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  seoJson: z.record(z.any()).optional(),
  // Category support
  primaryCategoryId: z.string().optional(), // Primary category (required for published products)
  additionalCategoryIds: z.array(z.string()).optional(), // Additional categories
})

export const updateProductSchema = createProductSchema.partial()

export const productQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  categoryId: z.string().optional(), // Filter by category
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

// Settings validation schemas
export const updateSettingsSchema = z.object({
  storeName: z.string().optional(),
  currency: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
  shipping: z.object({
    enabled: z.boolean().optional(),
    freeShippingThreshold: z.number().optional(),
  }).optional(),
  payments: z.object({
    myfatoorah: z.object({
      apiKey: z.string().optional(),
      testMode: z.boolean().optional(),
    }).optional(),
    tap: z.object({
      apiKey: z.string().optional(),
      testMode: z.boolean().optional(),
    }).optional(),
  }).optional(),
})

// Order validation schemas
export const createOrderSchema = z.object({
  customerJson: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      postalCode: z.string(),
    }).optional(),
  }),
  totalsJson: z.object({
    subtotal: z.number(),
    tax: z.number().default(0),
    shipping: z.number().default(0),
    total: z.number(),
  }),
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional(),
  totalsJson: z.record(z.any()).optional(),
  customerJson: z.record(z.any()).optional(),
})
