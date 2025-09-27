/**
 * Migration 001: Initial Schema Setup
 * 
 * Creates the initial database schema and indexes.
 */

import { Migration } from '../types';

export const migration001: Migration = {
  id: '001_initial_schema',
  name: 'Initial Schema Setup',
  version: '1.0.0',
  description: 'Creates initial database schema and indexes',
  
  async up(context) {
    const { db, logger } = context;
    
    logger('Creating initial collections and indexes...');
    
    // Create tenants collection with indexes
    await db.collection('tenants').doc('_indexes').set({
      indexes: [
        { field: 'slug', type: 'ascending', unique: true },
        { field: 'status', type: 'ascending' },
        { field: 'plan', type: 'ascending' },
        { field: 'createdAt', type: 'descending' }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create users collection with indexes
    await db.collection('users').doc('_indexes').set({
      indexes: [
        { field: 'email', type: 'ascending', unique: true },
        { field: 'tenantId', type: 'ascending' },
        { field: 'role', type: 'ascending' },
        { field: 'isActive', type: 'ascending' },
        { field: 'createdAt', type: 'descending' }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create products collection with indexes
    await db.collection('products').doc('_indexes').set({
      indexes: [
        { field: 'tenantId', type: 'ascending' },
        { field: 'status', type: 'ascending' },
        { field: 'categories', type: 'array' },
        { field: 'price', type: 'ascending' },
        { field: 'createdAt', type: 'descending' },
        { field: 'isBestSeller', type: 'ascending' },
        { field: 'isNewArrival', type: 'ascending' }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create categories collection with indexes
    await db.collection('categories').doc('_indexes').set({
      indexes: [
        { field: 'tenantId', type: 'ascending' },
        { field: 'slug', type: 'ascending' },
        { field: 'parentId', type: 'ascending' },
        { field: 'status', type: 'ascending' },
        { field: 'sortOrder', type: 'ascending' }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create orders collection with indexes
    await db.collection('orders').doc('_indexes').set({
      indexes: [
        { field: 'tenantId', type: 'ascending' },
        { field: 'customerId', type: 'ascending' },
        { field: 'status', type: 'ascending' },
        { field: 'createdAt', type: 'descending' },
        { field: 'orderNumber', type: 'ascending', unique: true }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create carts collection with indexes
    await db.collection('carts').doc('_indexes').set({
      indexes: [
        { field: 'tenantId', type: 'ascending' },
        { field: 'customerId', type: 'ascending' },
        { field: 'sessionId', type: 'ascending' },
        { field: 'updatedAt', type: 'descending' }
      ],
      createdAt: new Date().toISOString()
    });
    
    logger('Initial schema setup completed');
  },
  
  async down(context) {
    const { db, logger } = context;
    
    logger('Removing initial schema...');
    
    // Remove index documents
    await db.collection('tenants').doc('_indexes').delete();
    await db.collection('users').doc('_indexes').delete();
    await db.collection('products').doc('_indexes').delete();
    await db.collection('categories').doc('_indexes').delete();
    await db.collection('orders').doc('_indexes').delete();
    await db.collection('carts').doc('_indexes').delete();
    
    logger('Initial schema removal completed');
  }
};

