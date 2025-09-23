#!/usr/bin/env tsx

/**
 * Migration script to move from global User model to TenantUser model
 * This ensures proper tenant isolation for customer accounts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting migration to TenantUser model...')

  try {
    // Step 1: Create TenantUser records for existing orders with customer data
    console.log('📦 Migrating order customer data to TenantUser...')
    
    const ordersWithCustomerData = await prisma.order.findMany({
      where: {
        AND: [
          { customerEmail: { not: null } },
          { customerEmail: { not: '' } }
        ]
      },
      select: {
        id: true,
        tenantId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        userId: true
      }
    })

    console.log(`Found ${ordersWithCustomerData.length} orders with customer data`)

    for (const order of ordersWithCustomerData) {
      if (!order.customerEmail) continue

      // Check if TenantUser already exists for this tenant/email combination
      const existingTenantUser = await prisma.tenantUser.findUnique({
        where: {
          tenantId_email: {
            tenantId: order.tenantId,
            email: order.customerEmail
          }
        }
      })

      if (existingTenantUser) {
        // Update the order to reference the existing TenantUser
        await prisma.order.update({
          where: { id: order.id },
          data: { tenantUserId: existingTenantUser.id }
        })
        continue
      }

      // Create new TenantUser
      const tenantUser = await prisma.tenantUser.create({
        data: {
          tenantId: order.tenantId,
          userId: order.userId, // Link to global User if exists
          email: order.customerEmail,
          name: order.customerName,
          phone: order.customerPhone,
          isGuest: !order.userId // Mark as guest if no global user
        }
      })

      // Update the order to reference the new TenantUser
      await prisma.order.update({
        where: { id: order.id },
        data: { tenantUserId: tenantUser.id }
      })
    }

    console.log('✅ Order customer data migration completed')

    // Step 2: Create TenantUser records for existing payments
    console.log('💳 Migrating payment data to TenantUser...')
    
    const paymentsWithUserData = await prisma.payment.findMany({
      where: {
        userId: { not: null }
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        orderId: true
      },
      include: {
        order: {
          select: {
            customerEmail: true,
            customerName: true,
            customerPhone: true
          }
        }
      }
    })

    console.log(`Found ${paymentsWithUserData.length} payments with user data`)

    for (const payment of paymentsWithUserData) {
      if (!payment.userId) continue

      // Get the global user
      const globalUser = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { email: true, name: true, phone: true }
      })

      if (!globalUser) continue

      // Check if TenantUser already exists for this tenant/user combination
      const existingTenantUser = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: payment.tenantId,
            userId: payment.userId
          }
        }
      })

      if (existingTenantUser) {
        // Update the payment to reference the existing TenantUser
        await prisma.payment.update({
          where: { id: payment.id },
          data: { tenantUserId: existingTenantUser.id }
        })
        continue
      }

      // Create new TenantUser
      const tenantUser = await prisma.tenantUser.create({
        data: {
          tenantId: payment.tenantId,
          userId: payment.userId,
          email: globalUser.email,
          name: globalUser.name,
          phone: globalUser.phone,
          isGuest: false
        }
      })

      // Update the payment to reference the new TenantUser
      await prisma.payment.update({
        where: { id: payment.id },
        data: { tenantUserId: tenantUser.id }
      })
    }

    console.log('✅ Payment data migration completed')

    // Step 3: Create TenantUser records for platform users (memberships)
    console.log('👥 Migrating platform users to TenantUser...')
    
    const memberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        tenant: {
          select: {
            id: true
          }
        }
      }
    })

    console.log(`Found ${memberships.length} active memberships`)

    for (const membership of memberships) {
      // Check if TenantUser already exists for this tenant/user combination
      const existingTenantUser = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: membership.tenantId,
            userId: membership.userId
          }
        }
      })

      if (existingTenantUser) {
        console.log(`TenantUser already exists for user ${membership.user.email} in tenant ${membership.tenantId}`)
        continue
      }

      // Create new TenantUser for platform user
      await prisma.tenantUser.create({
        data: {
          tenantId: membership.tenantId,
          userId: membership.userId,
          email: membership.user.email,
          name: membership.user.name,
          phone: membership.user.phone,
          isGuest: false
        }
      })
    }

    console.log('✅ Platform users migration completed')

    // Step 4: Create TenantUser records for audit logs
    console.log('📝 Migrating audit log data to TenantUser...')
    
    const auditLogsWithUser = await prisma.auditLog.findMany({
      where: {
        actorUserId: { not: null },
        tenantId: { not: null }
      },
      select: {
        id: true,
        tenantId: true,
        actorUserId: true
      }
    })

    console.log(`Found ${auditLogsWithUser.length} audit logs with user data`)

    for (const auditLog of auditLogsWithUser) {
      if (!auditLog.actorUserId || !auditLog.tenantId) continue

      // Find the corresponding TenantUser
      const tenantUser = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: auditLog.tenantId,
            userId: auditLog.actorUserId
          }
        }
      })

      if (tenantUser) {
        // Update the audit log to reference the TenantUser
        await prisma.auditLog.update({
          where: { id: auditLog.id },
          data: { actorTenantUserId: tenantUser.id }
        })
      }
    }

    console.log('✅ Audit log data migration completed')

    console.log('🎉 Migration completed successfully!')
    console.log('📊 Summary:')
    console.log(`- Orders processed: ${ordersWithCustomerData.length}`)
    console.log(`- Payments processed: ${paymentsWithUserData.length}`)
    console.log(`- Memberships processed: ${memberships.length}`)
    console.log(`- Audit logs processed: ${auditLogsWithUser.length}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })


