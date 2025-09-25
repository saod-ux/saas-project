/**
 * Environment variable validation helpers
 */

export function getClientFirebaseConfig() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  const missing = required.filter(n => !process.env[n]);
  if (missing.length > 0) {
    console.error('[ENV] Missing Firebase client envs:', missing);
    console.error('[ENV] Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_FIREBASE')));
    throw new Error(`[ENV] Missing Firebase client envs: ${missing.join(', ')}`);
  }
  
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
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
