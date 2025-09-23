const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env' })

const prisma = new PrismaClient()

async function checkRLS() {
  try {
    console.log('🔍 Checking RLS and tenant filtering...\n')
    
    // Check if we can access ProductImage records directly
    const productImages = await prisma.productImage.findMany({
      take: 5,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            tenantId: true
          }
        },
        file: {
          select: {
            id: true,
            filename: true,
            tenantId: true
          }
        }
      }
    })
    
    console.log('🔗 ProductImage records (direct query):', productImages.length)
    productImages.forEach(pi => {
      console.log(`  - ID: ${pi.id}`)
      console.log(`    Product: ${pi.product.title} (${pi.product.id})`)
      console.log(`    Product Tenant: ${pi.product.tenantId}`)
      console.log(`    File: ${pi.file.filename} (${pi.file.id})`)
      console.log(`    File Tenant: ${pi.file.tenantId}`)
      console.log('')
    })
    
    // Check if we can access products with images
    const products = await prisma.product.findMany({
      where: {
        tenantId: 'cmf0j232o0000e4s9071kza0e'
      },
      take: 3,
      include: {
        productImages: {
          include: {
            file: true
          }
        }
      }
    })
    
    console.log('🛍️ Products with images (direct query):', products.length)
    products.forEach(product => {
      console.log(`  - ${product.title} (${product.id})`)
      console.log(`    Tenant ID: ${product.tenantId}`)
      console.log(`    Image count: ${product.productImages.length}`)
      if (product.productImages.length > 0) {
        product.productImages.forEach(pi => {
          console.log(`      - Image: ${pi.file.filename}`)
          console.log(`        File ID: ${pi.file.id}`)
        })
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRLS()













