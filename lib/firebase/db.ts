// Client-side imports
import { collection, doc, query, where, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './client';

// Server-side imports (only on server)
let serverCollection: any = null;
let serverDoc: any = null;
let serverAddDoc: any = null;
let serverUpdateDoc: any = null;
let serverDeleteDoc: any = null;
let serverWriteBatch: any = null;

// Server-side imports (only on server)
let serverDb: any = null;

// Check if we're on the server side and Firebase Admin is available
const isServer = typeof window === 'undefined';

// Function to get serverDb (lazy initialization)
export async function getServerDb() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerDb can only be called on server side');
  }
  
  if (!serverDb) {
    try {
      const serverOnlyModule = await import('./server-only');
      serverDb = serverOnlyModule.serverDb;
      
      console.log('ServerDb initialized:', !!serverDb);
    } catch (error) {
      console.warn('Firebase Admin Database not available:', error);
      throw new Error('Firebase Admin is not available');
    }
  }
  
  return serverDb;
}

// Debug logging removed to prevent client-side issues

// Collection names
export const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  TENANT_USERS: 'tenantUsers',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  HERO_SLIDES: 'heroSlides',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'auditLogs',
  PLATFORM_ADMINS: 'platformAdmins',
  MEMBERSHIPS: 'memberships',
  PAGES: 'pages',
  DOMAINS: 'domains',
} as const;

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date) => {
  // For now, just return the date as is to avoid timestamp issues
  return date;
};

// Helper function to add tenant isolation to queries
export const addTenantFilter = (baseQuery: any, tenantId: string) => {
  return where('tenantId', '==', tenantId);
};

// Helper function to create a document reference
export const createDocRef = async (collection: string, id?: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin is not available on client side');
  }
  
  const db = await getServerDb();
  if (id) {
    return db.collection(collection).doc(id);
  }
  return db.collection(collection).doc();
};

// Helper function to get a document
export const getDocument = async (collection: string, id: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('getDocument can only be called on server side');
  }
  
  const db = await getServerDb();
  const docRef = db.collection(collection).doc(id);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Helper function to get all documents from a collection
export const getAllDocuments = async (collection: string, orderByField?: string, limitCount?: number) => {
  if (typeof window !== 'undefined') {
    // Return empty array for client side
    console.warn('Firebase Admin is not available on client side');
    return [];
  }
  
  if (!collection || collection.trim() === '') {
    console.error('Collection name is required and cannot be empty');
    return [];
  }
  
  const db = await getServerDb();
  
  let q: any = db.collection(collection);
  
  if (orderByField) {
    q = q.orderBy(orderByField, 'desc');
  }
  
  if (limitCount) {
    q = q.limit(limitCount);
  }
  
  const querySnapshot = await q.get();
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

// Helper function to get documents with tenant filter
export const getTenantDocuments = async (collection: string, tenantId: string, orderByField?: string, limitCount?: number) => {
  if (typeof window !== 'undefined') {
    // Return empty array for client side
    console.warn('Firebase Admin is not available on client side');
    return [];
  }
  
  const db = await getServerDb();
  
  let q: any = db.collection(collection).where('tenantId', '==', tenantId);
  
  if (orderByField) {
    q = q.orderBy(orderByField, 'desc');
  }
  
  if (limitCount) {
    q = q.limit(limitCount);
  }
  
  const querySnapshot = await q.get();
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

// Helper function to create a document
export const createDocument = async (collectionName: string, data: any) => {
  if (typeof window !== 'undefined') {
    throw new Error('createDocument can only be called on server side');
  }
  
  const db = await getServerDb();
  
  // Use Firebase Admin SDK API
  const docRef = await db.collection(collectionName).add({
    ...data,
    createdAt: dateToTimestamp(new Date()),
    updatedAt: dateToTimestamp(new Date()),
  });
  return { id: docRef.id, ...data };
};

// Helper function to update a document
export const updateDocument = async (collection: string, id: string, data: any) => {
  if (typeof window !== 'undefined') {
    throw new Error('updateDocument can only be called on server side');
  }
  
  try {
    const db = await getServerDb();
    
    // Filter out undefined values but keep null values
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    // Use Firebase Admin SDK API
    const docRef = db.collection(collection).doc(id);
    
    // Use update() instead of set() with merge for better reliability
    await docRef.update({
      ...filteredData,
      updatedAt: new Date(),
    });
    
    return { id, ...filteredData };
  } catch (error) {
    console.error('updateDocument error:', error);
    throw error;
  }
};

// Helper function to delete a document
export const deleteDocument = async (collection: string, id: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('deleteDocument can only be called on server side');
  }
  
  const db = await getServerDb();
  
  // Use Firebase Admin SDK API
  const docRef = db.collection(collection).doc(id);
  await docRef.delete();
  return true;
};

// Helper function to create a batch
export const createBatch = () => {
  if (typeof window !== 'undefined') {
    throw new Error('createBatch can only be called on server side');
  }
  
  if (!serverDb) {
    throw new Error('Firebase Admin is not available');
  }
  
  return writeBatch(serverDb);
};

// Helper function to execute a batch
export const commitBatch = async (batch: any) => {
  await batch.commit();
};

// Helper function to add document to batch
export const addToBatch = (batch: any, collection: string, data: any, id?: string) => {
  const docRef = id ? createDocRef(collection, id) : createDocRef(collection);
  batch.set(docRef, {
    ...data,
    createdAt: dateToTimestamp(new Date()),
    updatedAt: dateToTimestamp(new Date()),
  });
  return docRef;
};

// Helper function to update document in batch
export const updateInBatch = (batch: any, collection: string, id: string, data: any) => {
  const docRef = createDocRef(collection, id);
  batch.update(docRef, {
    ...data,
    updatedAt: dateToTimestamp(new Date()),
  });
  return docRef;
};

// Helper function to delete document in batch
export const deleteInBatch = (batch: any, collection: string, id: string) => {
  const docRef = createDocRef(collection, id);
  batch.delete(docRef);
  return docRef;
};
