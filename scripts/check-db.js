const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('=== Checking Database State ===')
    
    // Check tenants
    const tenants = await prisma.tenant.findMany()
    console.log('\nTenants:', tenants.length)
    tenants.forEach(t => console.log(`- ${t.name} (${t.slug})`))
    
    // Check users
    const users = await prisma.user.findMany()
    console.log('\nUsers:', users.length)
    users.forEach(u => console.log(`- ${u.email} (${u.name}) - Clerk: ${u.clerkId}`))
    
    // Check memberships
    const memberships = await prisma.membership.findMany({
      include: {
        user: true,
        tenant: true
      }
    })
    console.log('\nMemberships:', memberships.length)
    memberships.forEach(m => console.log(`- ${m.user.email} -> ${m.tenant.slug} (${m.role}, ${m.status})`))
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
