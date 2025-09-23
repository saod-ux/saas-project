// Firestore utilities for tenant operations
import { 
  getDocument, 
  getTenantDocuments, 
  getAllDocuments,
  createDocument, 
  updateDocument, 
  deleteDocument,
  getServerDb,
  COLLECTIONS 
} from './db';

// Re-export the missing functions and constants
export { getTenantDocuments, COLLECTIONS };

// Tenant operations
export const getTenantBySlug = async (slug: string) => {
  if (typeof window !== 'undefined') {
    return null; // Client side
  }
  
  try {
    const db = await getServerDb();
    
    // Resolve tenant by slug via Firestore query (no hardcoded IDs)
    const tenantsSnapshot = await db.collection(COLLECTIONS.TENANTS)
      .where('slug', '==', slug)
      .get();
    
    if (tenantsSnapshot.empty) {
      return null;
    }
    
    const tenantDoc = tenantsSnapshot.docs[0];
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() };
    
    // Convert Firebase Timestamps to plain objects for serialization
    return {
      ...tenant,
      createdAt: tenant.createdAt?.seconds ? new Date(tenant.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
      updatedAt: tenant.updatedAt?.seconds ? new Date(tenant.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting tenant by slug:', error);
    return null;
  }
};

export const getTenantById = async (id: string) => {
  return await getDocument(COLLECTIONS.TENANTS, id);
};

export const createTenant = async (data: any) => {
  if (typeof window !== 'undefined') {
    throw new Error('createTenant can only be called on server side');
  }
  
  return await createDocument(COLLECTIONS.TENANTS, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateTenant = async (id: string, data: any) => {
  if (typeof window !== 'undefined') {
    throw new Error('updateTenant can only be called on server side');
  }
  
  try {
    const db = await getServerDb();
    const docRef = db.collection(COLLECTIONS.TENANTS).doc(id);
    
    // Use direct Firestore update for reliability
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    
    return { id, ...data };
  } catch (error) {
    console.error('updateTenant error:', error);
    throw error;
  }
};

export const deleteTenant = async (id: string) => {
  return await deleteDocument(COLLECTIONS.TENANTS, id);
};

// Tenant user operations
export const getTenantUserByEmail = async (tenantId: string, email: string) => {
  const users = await getTenantDocuments(COLLECTIONS.TENANT_USERS, tenantId);
  return users.find((user: any) => user.email === email) || null;
};

export const getTenantUserById = async (tenantId: string, id: string) => {
  const users = await getTenantDocuments(COLLECTIONS.TENANT_USERS, tenantId);
  return users.find((user: any) => user.id === id) || null;
};

export const createTenantUser = async (tenantId: string, data: any) => {
  return await createDocument(COLLECTIONS.TENANT_USERS, {
    ...data,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateTenantUser = async (tenantId: string, id: string, data: any) => {
  return await updateDocument(COLLECTIONS.TENANT_USERS, id, {
    ...data,
    tenantId,
    updatedAt: new Date(),
  });
};

export const getTenantUsers = async (tenantId: string, limit?: number) => {
  return await getTenantDocuments(COLLECTIONS.TENANT_USERS, tenantId, 'createdAt', limit);
};

export const deleteTenantUser = async (tenantId: string, id: string) => {
  return await deleteDocument(COLLECTIONS.TENANT_USERS, id);
};

// Product operations
export const getTenantProducts = async (tenantId: string, limit?: number) => {
  return await getTenantDocuments(COLLECTIONS.PRODUCTS, tenantId, 'createdAt', limit);
};

export const getTenantProductById = async (tenantId: string, id: string) => {
  const products = await getTenantDocuments(COLLECTIONS.PRODUCTS, tenantId);
  return products.find((product: any) => product.id === id) || null;
};

export const createTenantProduct = async (tenantId: string, data: any) => {
  return await createDocument(COLLECTIONS.PRODUCTS, {
    ...data,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateTenantProduct = async (tenantId: string, id: string, data: any) => {
  return await updateDocument(COLLECTIONS.PRODUCTS, id, {
    ...data,
    tenantId,
    updatedAt: new Date(),
  });
};

export const deleteTenantProduct = async (tenantId: string, id: string) => {
  return await deleteDocument(COLLECTIONS.PRODUCTS, id);
};

// Category operations
export const getTenantCategories = async (tenantId: string, limit?: number) => {
  return await getTenantDocuments(COLLECTIONS.CATEGORIES, tenantId, 'createdAt', limit);
};

export const getTenantCategoryById = async (tenantId: string, id: string) => {
  // Use direct Firestore query instead of getTenantDocuments to avoid potential caching issues
  const db = await getServerDb();
  const docRef = db.collection(COLLECTIONS.CATEGORIES).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('getTenantCategoryById: Document not found:', id);
    return null;
  }
  
  const category = { id: doc.id, ...doc.data() };
  return category;
};

export const createTenantCategory = async (tenantId: string, data: any) => {
  const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return await createDocument(COLLECTIONS.CATEGORIES, {
    id: categoryId,
    tenantId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateTenantCategory = async (tenantId: string, id: string, data: any) => {
  return await updateDocument(COLLECTIONS.CATEGORIES, id, {
    ...data,
    tenantId
  });
};

export const deleteTenantCategory = async (tenantId: string, id: string) => {
  return await deleteDocument(COLLECTIONS.CATEGORIES, id);
};

// Order operations
export const getTenantOrders = async (tenantId: string, limit?: number) => {
  return await getTenantDocuments(COLLECTIONS.ORDERS, tenantId, 'createdAt', limit);
};

export const getTenantOrderById = async (tenantId: string, id: string) => {
  const orders = await getTenantDocuments(COLLECTIONS.ORDERS, tenantId);
  return orders.find((order: any) => order.id === id) || null;
};

export const createTenantOrder = async (tenantId: string, data: any) => {
  return await createDocument(COLLECTIONS.ORDERS, {
    ...data,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateTenantOrder = async (tenantId: string, id: string, data: any) => {
  return await updateDocument(COLLECTIONS.ORDERS, id, {
    ...data,
    tenantId,
    updatedAt: new Date(),
  });
};

export const deleteTenantOrder = async (tenantId: string, id: string) => {
  return await deleteDocument(COLLECTIONS.ORDERS, id);
};

// Platform admin operations
export const getPlatformAdmins = async () => {
  return await getTenantDocuments(COLLECTIONS.PLATFORM_ADMINS, 'all');
};

export const getPlatformAdminByEmail = async (email: string) => {
  const admins = await getPlatformAdmins();
  return admins.find((admin: any) => admin.email === email) || null;
};

export const createPlatformAdmin = async (data: any) => {
  return await createDocument(COLLECTIONS.PLATFORM_ADMINS, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

// Membership operations
export const getTenantMemberships = async (tenantId: string) => {
  return await getTenantDocuments(COLLECTIONS.MEMBERSHIPS, tenantId);
};

export const getMembershipByUserAndTenant = async (userId: string, tenantId: string) => {
  const memberships = await getTenantMemberships(tenantId);
  return memberships.find((membership: any) => membership.userId === userId) || null;
};

export const createMembership = async (tenantId: string, data: any) => {
  return await createDocument(COLLECTIONS.MEMBERSHIPS, {
    ...data,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateMembership = async (tenantId: string, id: string, data: any) => {
  return await updateDocument(COLLECTIONS.MEMBERSHIPS, id, {
    ...data,
    tenantId,
    updatedAt: new Date(),
  });
};

export const deleteMembership = async (tenantId: string, id: string) => {
  return await deleteDocument(COLLECTIONS.MEMBERSHIPS, id);
};