import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getServerFirebaseConfig } from '@/lib/env';

export const runtime = 'nodejs';

// Initialize Firebase Admin SDK (server-only)
if (!getApps().length) {
  const { projectId, clientEmail, privateKey } = getServerFirebaseConfig();
  console.log('[SERVER] Firebase project ID:', projectId);
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// Export admin services
export const adminAuth = getAdminAuth();
