"use client";

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getClientFirebaseConfig } from '@/lib/env';

// Get Firebase config with strict validation (no fallbacks)
const firebaseConfig = getClientFirebaseConfig();

// Initialize Firebase app
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

// Log project ID for sanity check
console.info("[CLIENT] Firebase project ID:", firebaseConfig.projectId);

// Export Firebase services
export const firebaseApp = app;
export { auth, db };
