const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env' })

const prisma = new PrismaClient()

async function checkTenants() {
  try {
    console.log('🔍 Checking tenants in database...\n')
    
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true
      }
    })
    
    console.log('🏢 Tenants found:')
    tenants.forEach(tenant => {
      console.log(`  - ID: ${tenant.id}`)
      console.log(`    Name: ${tenant.name}`)
      console.log(`    Slug: ${tenant.slug}`)
      console.log(`    Domain: ${tenant.domain}`)
      console.log('')
    })
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTenants()
















