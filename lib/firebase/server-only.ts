// Server-only Firebase configuration
// This file should NEVER be imported by client-side code

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getStorageBucket } from '@/lib/config/storage';
import { getServerFirebaseConfig } from '@/lib/env';

let serverAuth: any = null;
let serverDb: any = null;
let serverStorage: any = null;
let serverApp: any = null;

// Only initialize on server side
if (typeof window === 'undefined') {
  try {
    // Get Firebase server config with validation
    const config = getServerFirebaseConfig();
    
    const serviceAccount = {
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    };

// Use centralized bucket configuration
const storageBucket = getStorageBucket(false);

    serverApp = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: storageBucket,
    }) : getApps()[0];

    // Initialize server-only instances
    serverAuth = getAuth(serverApp);
    serverDb = getFirestore(serverApp);
    // Ensure the Admin SDK ignores undefined properties to match client behavior
    serverDb.settings({ ignoreUndefinedProperties: true } as any);
    serverStorage = getStorage(serverApp);
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Keep null values for error cases
  }
}

// Export server-only instances
export { serverAuth, serverDb, serverStorage, serverApp };
