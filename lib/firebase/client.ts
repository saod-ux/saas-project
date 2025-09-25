"use client";

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getClientFirebaseConfig } from '@/lib/env';

// Get Firebase config with strict validation (no fallbacks)
const firebaseConfig = getClientFirebaseConfig();
console.log('🔍 Firebase Client Config:', { 
  projectId: firebaseConfig.projectId, 
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey 
});

// Initialize Firebase app
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
console.log('🔍 Firebase App initialized:', { appName: app.name, projectId: app.options.projectId });

// Initialize Firebase services
const auth = getAuth(app);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
console.log('🔍 Firebase Auth initialized:', { auth: !!auth });

// Export Firebase services
export const firebaseApp = app;
export { auth, db };
