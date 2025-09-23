import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDemoData() {
  console.log('🌱 Seeding demo data...')

  try {
    // Create demo retail tenant
    const retailTenant = await prisma.tenant.upsert({
      where: { slug: 'demo-store' },
      update: {},
      create: {
        slug: 'demo-store',
        name: 'Demo Store',
        template: 'RETAIL',
        status: 'active',
        settingsJson: {
          branding: {
            storeName: 'Demo Store',
            logoUrl: null,
            faviconUrl: null,
            primaryColor: '#2563eb',
            accentColor: '#10b981'
          },
          hero: {
            title: 'Welcome to Demo Store',
            subtitle: 'Discover amazing products at great prices',
            ctaLabel: 'Start Shopping',
            imageUrl: null
          },
          ui: {
            locale: 'en',
            currency: 'KWD',
            showCategories: true,
            showPriceFilter: true,
            showSort: true,
            placeholderStyle: 'grid'
          },
          links: {
            header: ['About', 'Contact', 'Products'],
            footer: {
              left: ['Privacy Policy', 'Terms of Service'],
              social: ['Facebook', 'Instagram', 'Twitter']
            }
          },
          policies: {
            returns: '30-day return policy',
            shipping: 'Free shipping on orders over 25 KWD'
          }
        }
      }
    })

    console.log('✅ Created tenants:', { retailTenant: retailTenant.slug })

    // Create categories for retail
    const categories = [
      { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
      { name: 'Clothing', slug: 'clothing', sortOrder: 2 },
      { name: 'Home & Garden', slug: 'home-garden', sortOrder: 3 },
      { name: 'Sports', slug: 'sports', sortOrder: 4 }
    ]

    const createdCategories = []
    for (const category of categories) {
      const created = await prisma.categories.upsert({
        where: { 
          tenantId_slug: {
            tenantId: retailTenant.id,
            slug: category.slug
          }
        },
        update: {},
        create: {
          id: `retail-${category.slug}`,
          tenantId: retailTenant.id,
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
          updatedAt: new Date()
        }
      })
      createdCategories.push(created)
    }

    console.log('✅ Created categories')

    // Create products for retail
    const products = [
      {
        title: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: '299.99',
        currency: 'KWD',
        stock: 12,
        status: 'active',
        primaryCategoryId: createdCategories[0].id, // Electronics
        hasVariants: false
      },
      {
        title: 'Smart Watch',
        description: 'Fitness tracking smartwatch with heart rate monitor',
        price: '199.99',
        currency: 'KWD',
        stock: 8,
        status: 'active',
        primaryCategoryId: createdCategories[0].id, // Electronics
        hasVariants: false
      },
      {
        title: 'Bluetooth Speaker',
        description: 'Portable speaker with 360-degree sound',
        price: '89.99',
        currency: 'KWD',
        stock: 15,
        status: 'active',
        primaryCategoryId: createdCategories[0].id, // Electronics
        hasVariants: false
      },
      {
        title: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: '29.99',
        currency: 'KWD',
        stock: 25,
        status: 'active',
        primaryCategoryId: createdCategories[1].id, // Clothing
        hasVariants: false
      },
      {
        title: 'Garden Tools Set',
        description: 'Complete set of garden tools for home gardening',
        price: '149.99',
        currency: 'KWD',
        stock: 5,
        status: 'active',
        primaryCategoryId: createdCategories[2].id, // Home & Garden
        hasVariants: false
      }
    ]

    for (const product of products) {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: {
          tenantId: retailTenant.id,
          title: product.title
        }
      })

      if (!existing) {
        await prisma.product.create({
          data: {
            tenantId: retailTenant.id,
            title: product.title,
            description: product.description,
            price: product.price,
            currency: product.currency,
            stock: product.stock,
            status: product.status,
            seoJson: {},
            hasVariants: product.hasVariants,
            primaryCategoryId: product.primaryCategoryId
          }
        })
      }
    }

    console.log('✅ Created products')

    console.log('🎉 Demo data seeded successfully!')
    console.log('\n📋 Available stores:')
    console.log(`  🛍️  Retail: http://localhost:3000/${retailTenant.slug}`)

  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDemoData()