/**
 * Firestore Security Rules Tests
 * 
 * These tests verify that our Firestore security rules properly enforce
 * tenant isolation and role-based access control.
 * 
 * Run with: firebase emulators:exec --only firestore "npm test"
 */

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { join } = require('path');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: readFileSync(join(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  describe('Tenant Isolation', () => {
    test('should allow tenant admin to read their own tenant data', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      
      // Setup: Create tenant admin user
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Create platform admin
        await db.collection('platformAdmins').doc(userId).set({
          role: 'ADMIN',
          createdAt: new Date(),
        });
        
        // Create tenant
        await db.collection('tenants').doc(tenantId).set({
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          createdAt: new Date(),
        });
        
        // Create membership
        await db.collection('memberships').doc(`${userId}_${tenantId}`).set({
          userId,
          tenantId,
          role: 'ADMIN',
          createdAt: new Date(),
        });
        
        // Test: Tenant admin should be able to read their tenant
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        expect(tenantDoc.exists).toBe(true);
        expect(tenantDoc.data().id).toBe(tenantId);
      });
    });

    test('should deny cross-tenant data access', async () => {
      const tenant1Id = 'tenant-1';
      const tenant2Id = 'tenant-2';
      const userId = 'user-123';
      
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Setup: Create two tenants
        await db.collection('tenants').doc(tenant1Id).set({
          id: tenant1Id,
          name: 'Tenant 1',
          slug: 'tenant-1',
        });
        
        await db.collection('tenants').doc(tenant2Id).set({
          id: tenant2Id,
          name: 'Tenant 2',
          slug: 'tenant-2',
        });
        
        // Create membership for tenant 1 only
        await db.collection('memberships').doc(`${userId}_${tenant1Id}`).set({
          userId,
          tenantId: tenant1Id,
          role: 'ADMIN',
        });
        
        // Test: User should not be able to read tenant 2 data
        await expect(
          db.collection('tenants').doc(tenant2Id).get()
        ).rejects.toThrow();
      });
    });
  });

  describe('Product Access Control', () => {
    test('should allow customers to read products from their tenant', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const productId = 'product-123';
      
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Setup: Create tenant user
        await db.collection('tenantUsers').doc(`${userId}_${tenantId}`).set({
          userId,
          tenantId,
          role: 'CUSTOMER',
        });
        
        // Create product
        await db.collection('products').doc(productId).set({
          id: productId,
          tenantId,
          name: 'Test Product',
          price: 100,
          isActive: true,
        });
        
        // Test: Customer should be able to read product
        const productDoc = await db.collection('products').doc(productId).get();
        expect(productDoc.exists).toBe(true);
        expect(productDoc.data().tenantId).toBe(tenantId);
      });
    });

    test('should deny customers from writing products', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const productId = 'product-123';
      
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Setup: Create tenant user
        await db.collection('tenantUsers').doc(`${userId}_${tenantId}`).set({
          userId,
          tenantId,
          role: 'CUSTOMER',
        });
        
        // Test: Customer should not be able to create product
        await expect(
          db.collection('products').doc(productId).set({
            id: productId,
            tenantId,
            name: 'Test Product',
            price: 100,
          })
        ).rejects.toThrow();
      });
    });
  });

  describe('Order Access Control', () => {
    test('should allow customers to read their own orders', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const orderId = 'order-123';
      
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Setup: Create tenant user
        await db.collection('tenantUsers').doc(`${userId}_${tenantId}`).set({
          userId,
          tenantId,
          role: 'CUSTOMER',
        });
        
        // Create order
        await db.collection('orders').doc(orderId).set({
          id: orderId,
          tenantId,
          customerId: userId,
          status: 'PENDING',
          total: 100,
        });
        
        // Test: Customer should be able to read their order
        const orderDoc = await db.collection('orders').doc(orderId).get();
        expect(orderDoc.exists).toBe(true);
        expect(orderDoc.data().customerId).toBe(userId);
      });
    });

    test('should deny customers from reading other customers orders', async () => {
      const tenantId = 'tenant-123';
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const orderId = 'order-123';
      
      await testEnv.withSecurityRules(async (context) => {
        const db = context.firestore();
        
        // Setup: Create two tenant users
        await db.collection('tenantUsers').doc(`${userId1}_${tenantId}`).set({
          userId: userId1,
          tenantId,
          role: 'CUSTOMER',
        });
        
        await db.collection('tenantUsers').doc(`${userId2}_${tenantId}`).set({
          userId: userId2,
          tenantId,
          role: 'CUSTOMER',
        });
        
        // Create order for user 2
        await db.collection('orders').doc(orderId).set({
          id: orderId,
          tenantId,
          customerId: userId2,
          status: 'PENDING',
          total: 100,
        });
        
        // Test: User 1 should not be able to read user 2's order
        await expect(
          db.collection('orders').doc(orderId).get()
        ).rejects.toThrow();
      });
    });
  });
});
