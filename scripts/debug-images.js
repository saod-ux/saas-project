const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env' })

const prisma = new PrismaClient()

async function debugImages() {
  try {
    console.log('🔍 Debugging image linking...\n')
    
    // Check files
    const files = await prisma.file.findMany({
      where: { fileType: 'product' },
      include: { productImages: true }
    })
    
    console.log('📁 Files in database:')
    files.forEach(file => {
      console.log(`  - ${file.filename} (${file.id})`)
      console.log(`    Bucket: ${file.bucket}`)
      console.log(`    Key: ${file.key}`)
      console.log(`    Public URL: ${file.publicUrl}`)
      console.log(`    Product Images: ${file.productImages.length}`)
      console.log('')
    })
    
    // Check products
    const products = await prisma.product.findMany({
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
      console.log(`    Image count: ${product.productImages.length}`)
      product.productImages.forEach(pi => {
        console.log(`    - Image: ${pi.file.filename}`)
        console.log(`      File ID: ${pi.file.id}`)
        console.log(`      Public URL: ${pi.file.publicUrl}`)
      })
      console.log('')
    })
    
    // Check ProductImage records
    const productImages = await prisma.productImage.findMany({
      include: {
        product: true,
        file: true
      }
    })
    
    console.log('🔗 ProductImage records:')
    productImages.forEach(pi => {
      console.log(`  - Product: ${pi.product.title}`)
      console.log(`    File: ${pi.file.filename}`)
      console.log(`    Order: ${pi.order}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugImages()















