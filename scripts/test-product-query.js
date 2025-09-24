const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env' })

const prisma = new PrismaClient()

async function testProductQuery() {
  try {
    console.log('🧪 Testing product query directly...\n')
    
    // First, check if the ProductImage record exists
    const productImages = await prisma.productImage.findMany({
      include: {
        product: true,
        file: true
      }
    })
    
    console.log('🔗 ProductImage records found:', productImages.length)
    productImages.forEach(pi => {
      console.log(`  - ID: ${pi.id}`)
      console.log(`    Product: ${pi.product.title} (${pi.product.id})`)
      console.log(`    File: ${pi.file.filename} (${pi.file.id})`)
      console.log(`    Product Tenant: ${pi.product.tenantId}`)
      console.log(`    File Tenant: ${pi.file.tenantId}`)
      console.log('')
    })
    
    // Now test the product query with the same conditions
    const tenantId = 'cmf0j232o0000e4s9071kza0e' // demo-store tenant ID
    
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        productImages: {
          include: {
            file: true
          }
        }
      }
    })
    
    console.log('🛍️ Products with images:')
    products.forEach(product => {
      console.log(`  - ${product.title} (${product.id})`)
      console.log(`    Tenant ID: ${product.tenantId}`)
      console.log(`    Image count: ${product.productImages.length}`)
      if (product.productImages.length > 0) {
        product.productImages.forEach(pi => {
          console.log(`      - Image: ${pi.file.filename}`)
          console.log(`        File ID: ${pi.file.id}`)
          console.log(`        File Tenant: ${pi.file.tenantId}`)
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

testProductQuery()















