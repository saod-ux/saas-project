// Tenant user operations for Firebase
import { 
  getDocument, 
  getTenantDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  COLLECTIONS 
} from './db';

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