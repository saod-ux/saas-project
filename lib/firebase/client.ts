// lib/firebase/client.ts
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getClientFirebaseConfig } from '@/lib/env';

let appSingleton: FirebaseApp | null = null;

export function getFirebase() {
  if (!appSingleton) {
    const cfg = getClientFirebaseConfig();
    console.log('[CLIENT] Firebase env check', {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    });
    appSingleton = getApps().length ? getApp() : initializeApp(cfg);
    console.log('[CLIENT] Firebase app initialized', { name: appSingleton.name });
  }
  const auth: Auth = getAuth(appSingleton);
  const db: Firestore = getFirestore(appSingleton);
  return { app: appSingleton, auth, db };
}