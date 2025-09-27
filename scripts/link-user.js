const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Looking for demo-store tenant...')
    
    // Find the demo-store tenant
    const demoTenant = await prisma.tenant.findUnique({
      where: { slug: 'demo-store' }
    })

    if (!demoTenant) {
      console.log('❌ Demo tenant not found. Creating it...')
      
      const newTenant = await prisma.tenant.create({
        data: {
          name: 'Demo Store',
          slug: 'demo-store',
          settingsJson: { 
            storeName: 'Demo Store', 
            currency: 'KWD',
            description: 'A demo store for testing'
          }
        }
      })
      console.log('✅ Demo tenant created:', newTenant.id)
    } else {
      console.log('✅ Demo tenant found:', demoTenant.id)
    }

    console.log('\n🔍 Looking for your user...')
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: 'fnissan.q8@gmail.com' }
    })

    if (!user) {
      console.log('❌ User not found. Creating it...')
      
      // You need to replace this with your actual Clerk user ID
      const clerkUserId = 'REPLACE_WITH_YOUR_ACTUAL_CLERK_USER_ID'
      
      user = await prisma.user.create({
        data: {
          email: 'fnissan.q8@gmail.com',
          name: 'Saud',
          clerkId: clerkUserId
        }
      })
      console.log('✅ User created:', user.id)
    } else {
      console.log('✅ User found:', user.id)
    }

    console.log('\n🔍 Checking membership...')
    
    // Check if membership exists
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: demoTenant.id
      }
    })

    if (!existingMembership) {
      console.log('❌ Membership not found. Creating it...')
      
      const membership = await prisma.membership.create({
        data: {
          userId: user.id,
          tenantId: demoTenant.id,
          role: 'OWNER',
          status: 'ACTIVE',
          acceptedAt: new Date()
        }
      })
      console.log('✅ Membership created:', membership.id)
    } else {
      console.log('✅ Membership already exists:', existingMembership.id)
    }

    console.log('\n🎉 Setup complete!')
    console.log('Now try accessing http://localhost:3000/admin/products again.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
















