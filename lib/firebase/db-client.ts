// Client-side Firestore utilities only
import { collection, doc, query, where, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './client';

// Collection names
export const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  TENANT_USERS: 'tenantUsers',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'auditLogs',
  PLATFORM_ADMINS: 'platformAdmins',
  MEMBERSHIPS: 'memberships',
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
  return Timestamp.fromDate(date);
};

// Client-side functions that return empty arrays or throw errors
export const getTenantDocuments = async (collection: string, tenantId: string, orderByField?: string, limitCount?: number) => {
  console.warn('getTenantDocuments called on client side - returning empty array');
  return [];
};

export const createDocument = async (collection: string, data: any) => {
  throw new Error('createDocument can only be called on server side');
};

export const updateDocument = async (collection: string, id: string, data: any) => {
  throw new Error('updateDocument can only be called on server side');
};

export const deleteDocument = async (collection: string, id: string) => {
  throw new Error('deleteDocument can only be called on server side');
};

export const getDocument = async (collection: string, id: string) => {
  console.warn('getDocument called on client side - returning null');
  return null;
};

export const createBatch = () => {
  throw new Error('createBatch can only be called on server side');
};

export const commitBatch = async (batch: any) => {
  throw new Error('commitBatch can only be called on server side');
};

export const addToBatch = (batch: any, collection: string, data: any, id?: string) => {
  throw new Error('addToBatch can only be called on server side');
};

export const updateInBatch = (batch: any, collection: string, id: string, data: any) => {
  throw new Error('updateInBatch can only be called on server side');
};

export const deleteInBatch = (batch: any, collection: string, id: string) => {
  throw new Error('deleteInBatch can only be called on server side');
};

