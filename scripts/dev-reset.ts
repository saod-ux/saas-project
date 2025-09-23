#!/usr/bin/env tsx

/**
 * DEV RESET SCRIPT
 * 
 * ⚠️  DANGER: This script will DELETE ALL DATA from the database.
 * Only run this in development environments.
 * 
 * Usage: pnpm dev:reset
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Safety check - never run in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: This script cannot be run in production!');
    console.error('   NODE_ENV is set to "production"');
    process.exit(1);
  }

  console.log('🧹 Starting development database reset...');
  console.log('⚠️  This will DELETE ALL DATA from the database!');
  
  try {
    // Truncate tables in dependency order (cascade)
    console.log('🗑️  Truncating tables...');
    
    await prisma.auditLog.deleteMany();
    console.log('   ✓ audit_logs');
    
    await prisma.webhookEvent.deleteMany();
    console.log('   ✓ webhook_events');
    
    await prisma.payment.deleteMany();
    console.log('   ✓ payments');
    
    await prisma.subscription.deleteMany();
    console.log('   ✓ subscriptions');
    
    await prisma.plan.deleteMany();
    console.log('   ✓ plans');
    
    await prisma.domain.deleteMany();
    console.log('   ✓ domains');
    
    await prisma.membership.deleteMany();
    console.log('   ✓ memberships');
    
    await prisma.user.deleteMany();
    console.log('   ✓ users');
    
    await prisma.tenant.deleteMany();
    console.log('   ✓ tenants');
    
    // Clean up any related data
    await prisma.order.deleteMany();
    console.log('   ✓ orders');
    
    await prisma.orderItem.deleteMany();
    console.log('   ✓ order_items');
    
    await prisma.product.deleteMany();
    console.log('   ✓ products');
    
    await prisma.productImage.deleteMany();
    console.log('   ✓ product_images');
    
    await prisma.category.deleteMany();
    console.log('   ✓ categories');
    
    await prisma.heroSlide.deleteMany();
    console.log('   ✓ hero_slides');
    
    await prisma.page.deleteMany();
    console.log('   ✓ pages');
    
    await prisma.paymentConfig.deleteMany();
    console.log('   ✓ payment_configs');
    
    await prisma.platformAdmin.deleteMany();
    console.log('   ✓ platform_admins');

    console.log('');
    console.log('✅ Database reset completed successfully!');
    console.log('   All demo data has been removed.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Create a SUPER_ADMIN user (SQL or seed script)');
    console.log('   2. Create your first tenant');
    console.log('   3. Configure payment providers');
    console.log('   4. Test the platform functionality');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


