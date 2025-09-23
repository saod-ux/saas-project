// Server-side Firebase Storage utilities
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getStorageBucket, getPublicUrl } from '@/lib/config/storage';

let serverStorage: any = null;

// Initialize Firebase Admin Storage
export const getServerStorage = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin Storage is not available on client side');
  }
  
  if (!serverStorage) {
    try {
      // Get or initialize Firebase Admin app
      let app;
      const apps = getApps();
      if (apps.length === 0) {
        // Initialize Firebase Admin if not already initialized
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
          throw new Error('Firebase Admin environment variables are not set. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        }
        
        const serviceAccount = {
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
        
// Use centralized bucket configuration
const normalizedBucket = getStorageBucket(false);

        app = initializeApp({
          credential: cert(serviceAccount),
          storageBucket: normalizedBucket
        });
      } else {
        app = apps[0];
      }
      
      serverStorage = getStorage(app);
    } catch (error) {
      console.error('Failed to initialize Firebase Admin Storage:', error);
      throw new Error('Firebase Admin Storage is not available');
    }
  }
  
  return serverStorage;
};

// Server-side storage functions
export const adminUploadFile = async (path: string, buffer: Buffer, metadata?: any) => {
  const storage = await getServerStorage();
  const bucketName = getStorageBucket(false);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  
  await file.save(buffer, {
    metadata: {
      contentType: metadata?.contentType || 'application/octet-stream',
      ...metadata,
    },
  });
  
  // Use centralized URL generation
  const publicUrl = getPublicUrl(path);
  
  return { downloadURL: publicUrl, file };
};

export const adminDeleteFile = async (path: string) => {
  const storage = await getServerStorage();
  const bucketName = getStorageBucket(false);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  await file.delete();
  return true;
};

export const adminGetFileMetadata = async (path: string) => {
  const storage = await getServerStorage();
  const bucketName = getStorageBucket(false);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  const [metadata] = await file.getMetadata();
  return metadata;
};
