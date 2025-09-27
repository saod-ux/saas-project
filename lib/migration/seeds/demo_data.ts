/**
 * Demo Data Seed
 * 
 * Seeds the database with demo data for development and testing.
 */

import { SeedData } from '../types';

export const demoSeedData: SeedData = {
  tenants: [
    {
      id: 'demo-store',
      slug: 'demo-store',
      name: 'Demo Store',
      description: 'A demonstration store for testing and development',
      plan: 'premium',
      settings: {
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          logoUrl: 'https://storage.googleapis.com/e-viewstorage-public/demo-store/logo.png'
        },
        social: {
          instagram: 'https://instagram.com/demostore',
          facebook: 'https://facebook.com/demostore',
          twitter: 'https://twitter.com/demostore'
        },
        store: {
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'en'
        }
      }
    },
    {
      id: 'test-store',
      slug: 'test-store',
      name: 'Test Store',
      description: 'Another test store for multi-tenant testing',
      plan: 'free',
      settings: {
        theme: {
          primaryColor: '#10B981',
          secondaryColor: '#059669',
          logoUrl: 'https://storage.googleapis.com/e-viewstorage-public/test-store/logo.png'
        },
        store: {
          currency: 'USD',
          timezone: 'America/Los_Angeles',
          language: 'en'
        }
      }
    }
  ],
  
  users: [
    {
      id: 'admin-demo',
      email: 'admin@demo-store.com',
      name: 'Demo Admin',
      role: 'admin',
      tenantId: 'demo-store',
      isActive: true
    },
    {
      id: 'owner-demo',
      email: 'owner@demo-store.com',
      name: 'Demo Owner',
      role: 'owner',
      tenantId: 'demo-store',
      isActive: true
    },
    {
      id: 'customer-demo',
      email: 'customer@demo-store.com',
      name: 'Demo Customer',
      role: 'customer',
      tenantId: 'demo-store',
      isActive: true
    },
    {
      id: 'admin-test',
      email: 'admin@test-store.com',
      name: 'Test Admin',
      role: 'admin',
      tenantId: 'test-store',
      isActive: true
    }
  ],
  
  categories: [
    {
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      tenantId: 'demo-store',
      sortOrder: 1
    },
    {
      id: 'clothing',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      tenantId: 'demo-store',
      sortOrder: 2
    },
    {
      id: 'home-garden',
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      tenantId: 'demo-store',
      sortOrder: 3
    },
    {
      id: 'smartphones',
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      parentId: 'electronics',
      tenantId: 'demo-store',
      sortOrder: 1
    },
    {
      id: 'laptops',
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptop computers and accessories',
      parentId: 'electronics',
      tenantId: 'demo-store',
      sortOrder: 2
    }
  ],
  
  products: [
    {
      id: 'iphone-15',
      name: 'iPhone 15 Pro',
      description: 'The latest iPhone with advanced features and premium design',
      price: 999.99,
      compareAtPrice: 1099.99,
      sku: 'IPH15-PRO-128',
      status: 'active',
      categoryIds: ['smartphones'],
      tenantId: 'demo-store',
      inventory: {
        trackQuantity: true,
        quantity: 50,
        allowBackorder: false
      },
      images: [
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/iphone-15-1.jpg',
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/iphone-15-2.jpg'
      ],
      isBestSeller: true,
      isNewArrival: true
    },
    {
      id: 'macbook-air',
      name: 'MacBook Air M2',
      description: 'Ultra-thin laptop with M2 chip for exceptional performance',
      price: 1199.99,
      compareAtPrice: 1299.99,
      sku: 'MBA-M2-256',
      status: 'active',
      categoryIds: ['laptops'],
      tenantId: 'demo-store',
      inventory: {
        trackQuantity: true,
        quantity: 25,
        allowBackorder: true
      },
      images: [
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/macbook-air-1.jpg',
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/macbook-air-2.jpg'
      ],
      isBestSeller: true
    },
    {
      id: 'wireless-headphones',
      name: 'Wireless Noise-Canceling Headphones',
      description: 'Premium wireless headphones with active noise cancellation',
      price: 299.99,
      sku: 'WH-NC-001',
      status: 'active',
      categoryIds: ['electronics'],
      tenantId: 'demo-store',
      inventory: {
        trackQuantity: true,
        quantity: 100,
        allowBackorder: false
      },
      images: [
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/headphones-1.jpg'
      ]
    },
    {
      id: 'cotton-tshirt',
      name: 'Premium Cotton T-Shirt',
      description: 'Soft, comfortable cotton t-shirt in various colors',
      price: 29.99,
      compareAtPrice: 39.99,
      sku: 'CT-001',
      status: 'active',
      categoryIds: ['clothing'],
      tenantId: 'demo-store',
      inventory: {
        trackQuantity: true,
        quantity: 200,
        allowBackorder: false
      },
      images: [
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/tshirt-1.jpg',
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/tshirt-2.jpg'
      ]
    },
    {
      id: 'garden-tools',
      name: 'Professional Garden Tool Set',
      description: 'Complete set of professional gardening tools',
      price: 89.99,
      sku: 'GT-SET-001',
      status: 'active',
      categoryIds: ['home-garden'],
      tenantId: 'demo-store',
      inventory: {
        trackQuantity: true,
        quantity: 30,
        allowBackorder: true
      },
      images: [
        'https://storage.googleapis.com/e-viewstorage-public/demo-store/products/garden-tools-1.jpg'
      ]
    }
  ],
  
  settings: [
    {
      tenantId: 'demo-store',
      settings: {
        store: {
          name: 'Demo Store',
          description: 'Your one-stop shop for quality products',
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'en',
          taxRate: 0.08,
          shippingRate: 9.99,
          freeShippingThreshold: 75.00
        },
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          accentColor: '#F59E0B',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          logoUrl: 'https://storage.googleapis.com/e-viewstorage-public/demo-store/logo.png'
        },
        social: {
          instagram: 'https://instagram.com/demostore',
          facebook: 'https://facebook.com/demostore',
          twitter: 'https://twitter.com/demostore',
          youtube: 'https://youtube.com/demostore'
        },
        seo: {
          title: 'Demo Store - Quality Products at Great Prices',
          description: 'Discover amazing products at Demo Store. Fast shipping, great prices, and excellent customer service.',
          keywords: ['electronics', 'clothing', 'home', 'garden', 'quality', 'affordable']
        }
      }
    },
    {
      tenantId: 'test-store',
      settings: {
        store: {
          name: 'Test Store',
          description: 'Testing store for development',
          currency: 'USD',
          timezone: 'America/Los_Angeles',
          language: 'en',
          taxRate: 0.10,
          shippingRate: 5.99,
          freeShippingThreshold: 50.00
        },
        theme: {
          primaryColor: '#10B981',
          secondaryColor: '#059669',
          accentColor: '#F59E0B',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          logoUrl: 'https://storage.googleapis.com/e-viewstorage-public/test-store/logo.png'
        }
      }
    }
  ]
};

