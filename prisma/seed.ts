import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tenants
  const acme = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Inc',
      slug: 'acme',
      settingsJson: { storeName: 'Acme Store', currency: 'USD' }
    }
  })

  const moka = await prisma.tenant.upsert({
    where: { slug: 'moka' },
    update: {},
    create: {
      name: 'Moka LLC',
      slug: 'moka',
      settingsJson: { storeName: 'Moka Store', currency: 'USD' }
    }
  })

  // Create demo users (these will be linked to Clerk users later)
  const acmeOwner = await prisma.user.upsert({
    where: { email: 'owner@acme.com' },
    update: {},
    create: {
      email: 'owner@acme.com',
      name: 'Acme Owner',
      clerkId: 'stub-clerk-id-acme-owner' // Will be replaced with real Clerk ID
    }
  })

  const mokaOwner = await prisma.user.upsert({
    where: { email: 'owner@moka.com' },
    update: {},
    create: {
      email: 'owner@moka.com',
      name: 'Moka Owner',
      clerkId: 'stub-clerk-id-moka-owner' // Will be replaced with real Clerk ID
    }
  })

  // Create memberships
  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: acme.id,
        userId: acmeOwner.id
      }
    },
    update: {},
    create: {
      tenantId: acme.id,
      userId: acmeOwner.id,
      role: 'OWNER',
      status: 'ACTIVE',
      acceptedAt: new Date()
    }
  })

  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: moka.id,
        userId: mokaOwner.id
      }
    },
    update: {},
    create: {
      tenantId: moka.id,
      userId: mokaOwner.id,
      role: 'OWNER',
      status: 'ACTIVE',
      acceptedAt: new Date()
    }
  })

  async function seedProducts(tenantId: string, prefix: string) {
    for (let i = 1; i <= 5; i++) {
      await prisma.product.upsert({
        where: { id: `${tenantId}-${i}` },
        update: {},
        create: {
          id: `${tenantId}-${i}`,
          tenantId,
          title: `${prefix} Product ${i}`,
          price: new Prisma.Decimal(i * 10),
          currency: 'USD',
          stock: 100 + i,
          status: 'active',
        }
      })
    }
  }

  await seedProducts(acme.id, 'Acme')
  await seedProducts(moka.id, 'Moka')

  const acmeCount = await prisma.product.count({ where: { tenantId: acme.id } })
  const mokaCount = await prisma.product.count({ where: { tenantId: moka.id } })
  const acmeMembers = await prisma.membership.count({ where: { tenantId: acme.id } })
  const mokaMembers = await prisma.membership.count({ where: { tenantId: moka.id } })

  console.log('Seed summary:')
  console.log(`- Tenants: 2 (acme, moka)`)
  console.log(`- Products: acme=${acmeCount}, moka=${mokaCount}`)
  console.log(`- Members: acme=${acmeMembers}, moka=${mokaMembers}`)
  console.log('\nDemo accounts:')
  console.log(`- Acme: owner@acme.com (OWNER)`)
  console.log(`- Moka: owner@moka.com (OWNER)`)
  console.log('\nNote: Replace stub-clerk-id-* with real Clerk user IDs after authentication setup')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
