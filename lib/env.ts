/**
 * Environment variable validation helpers
 */

export function getClientFirebaseConfig() {
  // For now, always use the hardcoded config since env vars aren't loading on client
  console.warn('[ENV] Using hardcoded Firebase config for client-side');
  return {
    apiKey: "AIzaSyDrlglslH6lm0NiW4mUZobV6QkwPn97x4A",
    authDomain: "e-view-7ebc8.firebaseapp.com",
    projectId: "e-view-7ebc8",
    storageBucket: "e-viewstorage-public",
    messagingSenderId: "851268561585",
    appId: "1:851268561585:web:64b4441d81b6ee7b791090",
    measurementId: "G-GL1JLMLZVE",
  };
}

export function getServerFirebaseConfig() {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  
  const missing = required.filter(n => !process.env[n]);
  if (missing.length > 0) {
    console.error('[ENV] Missing Firebase server envs:', missing);
    throw new Error(`[ENV] Missing Firebase server envs: ${missing.join(', ')}`);
  }
  
  return {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  };
}
