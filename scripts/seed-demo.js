#!/usr/bin/env node

/**
 * Seed demo data for testing
 */

require('dotenv').config({ path: '.env' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...')
    
    // Check if demo tenant exists
    let demoTenant = await prisma.tenant.findFirst({
      where: { slug: 'demo-store' }
    })
    
    if (!demoTenant) {
      console.log('📝 Creating demo tenant...')
      demoTenant = await prisma.tenant.create({
        data: {
          name: 'Demo Store',
          slug: 'demo-store',
          domain: null,
          settingsJson: {
            storefrontTheme: {
              primaryColor: '#3B82F6',
              secondaryColor: '#1F2937',
              logoUrl: null
            },
            heroSettings: {
              heroTitle: { en: 'Welcome to Demo Store', ar: 'مرحباً بكم في المتجر التجريبي' },
              heroSubtitle: { en: 'Discover amazing products', ar: 'اكتشف منتجات رائعة' },
              heroCtaLabel: { en: 'Shop Now', ar: 'تسوق الآن' },
              heroImageUrl: null
            }
          }
        }
      })
      console.log('✅ Demo tenant created:', demoTenant.slug)
    } else {
      console.log('✅ Demo tenant already exists:', demoTenant.slug)
    }
    
    // Check if demo user exists
    let demoUser = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    })
    
    if (!demoUser) {
      console.log('📝 Creating demo user...')
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo Merchant',
          clerkId: 'demo-clerk-id-123'
        }
      })
      console.log('✅ Demo user created:', demoUser.email)
    } else {
      console.log('✅ Demo user already exists:', demoUser.email)
    }
    
    // Check if membership exists
    let membership = await prisma.membership.findFirst({
      where: {
        userId: demoUser.id,
        tenantId: demoTenant.id
      }
    })
    
    if (!membership) {
      console.log('📝 Creating demo membership...')
      membership = await prisma.membership.create({
        data: {
          userId: demoUser.id,
          tenantId: demoTenant.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      })
      console.log('✅ Demo membership created')
    } else {
      console.log('✅ Demo membership already exists')
    }
    
    // Create a demo category
    let demoCategory = await prisma.categories.findFirst({
      where: {
        tenantId: demoTenant.id,
        slug: 'electronics'
      }
    })
    
    if (!demoCategory) {
      console.log('📝 Creating demo category...')
      demoCategory = await prisma.categories.create({
        data: {
          id: `cat-${Date.now()}`,
          tenantId: demoTenant.id,
          name: 'Electronics',
          slug: 'electronics',
          sortOrder: 1,
          updatedAt: new Date()
        }
      })
      console.log('✅ Demo category created:', demoCategory.slug)
    } else {
      console.log('✅ Demo category already exists:', demoCategory.slug)
    }
    
    console.log('\n🎉 Demo data seeding completed!')
    console.log('\n📋 Test Credentials:')
    console.log('   Tenant Slug: demo-store')
    console.log('   User Email: demo@example.com')
    console.log('   User Role: OWNER')
    console.log('\n🔗 Test URLs:')
    console.log('   Storefront: http://localhost:3000/demo-store')
    console.log('   Admin: http://localhost:3000/admin')
    console.log('   Sign In: http://localhost:3000/sign-in')
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDemoData()
