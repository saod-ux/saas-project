"use client";

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getClientFirebaseConfig } from '@/lib/env';

// Lazy initialization to avoid server-side execution
let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function initializeFirebase() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client can only be initialized in the browser');
  }

  if (firebaseAppInstance) {
    return { firebaseApp: firebaseAppInstance, auth: authInstance!, db: dbInstance! };
  }

  try {
    // Get Firebase config with strict validation (no fallbacks)
    const firebaseConfig = getClientFirebaseConfig();

    // Initialize Firebase app
    firebaseAppInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

    // Initialize Firebase services
    authInstance = getAuth(firebaseAppInstance);
    dbInstance = initializeFirestore(firebaseAppInstance, { ignoreUndefinedProperties: true });

    // Log project ID for sanity check
    console.info("[CLIENT] Firebase project ID:", firebaseConfig.projectId);

    return { firebaseApp: firebaseAppInstance, auth: authInstance, db: dbInstance };
  } catch (error) {
    console.error('[CLIENT] Firebase initialization failed:', error);
    throw error;
  }
}

// Export getters that initialize Firebase on first access
export function getFirebaseApp(): FirebaseApp {
  const { firebaseApp } = initializeFirebase();
  return firebaseApp;
}

export function getAuthInstance(): Auth {
  const { auth } = initializeFirebase();
  return auth;
}

export function getFirestoreInstance(): Firestore {
  const { db } = initializeFirebase();
  return db;
}

// Legacy exports for backward compatibility (lazy)
export const firebaseApp = new Proxy({} as FirebaseApp, {
  get(target, prop) {
    return getFirebaseApp()[prop as keyof FirebaseApp];
  }
});

export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    return getAuthInstance()[prop as keyof Auth];
  }
});

export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    return getFirestoreInstance()[prop as keyof Firestore];
  }
});