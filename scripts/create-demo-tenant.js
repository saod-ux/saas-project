const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Create demo-store tenant
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: 'demo-store' },
      update: {},
      create: {
        name: 'Demo Store',
        slug: 'demo-store',
        settingsJson: { 
          storeName: 'Demo Store', 
          currency: 'KWD',
          description: 'A demo store for testing'
        }
      }
    })

    console.log('✅ Demo tenant created:', demoTenant)

    // Create a user record for your Clerk user
    // You'll need to replace this with your actual Clerk user ID
    const demoUser = await prisma.user.upsert({
      where: { email: 'fnissan.q8@gmail.com' },
      update: {},
      create: {
        email: 'fnissan.q8@gmail.com',
        name: 'Saud',
        clerkId: 'YOUR_CLERK_USER_ID_HERE' // Replace this
      }
    })

    console.log('✅ Demo user created:', demoUser)

    // Create membership
    const membership = await prisma.membership.upsert({
      where: {
        tenantId_userId: {
          tenantId: demoTenant.id,
          userId: demoUser.id
        }
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: demoUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
        acceptedAt: new Date()
      }
    })

    console.log('✅ Membership created:', membership)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()













