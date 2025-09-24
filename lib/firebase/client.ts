import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getStorageBucket } from '@/lib/config/storage';

// Check for required environment variables (client-side only)
let missingVars: string[] = [];
if (typeof window !== 'undefined') {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  missingVars = requiredEnvVars.filter(varName => !(process.env as any)[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars);
    console.error('Please add these to your .env.local file. See FIREBASE_SETUP.md for details.');
  }
}

const firebaseConfig = {
  apiKey: typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key') : 'demo-api-key',
  authDomain: typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-app.firebaseapp.com') : 'demo-app.firebaseapp.com',
  projectId: typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-app') : 'demo-app',
  storageBucket: getStorageBucket(true),
  messagingSenderId: typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789') : '123456789',
  appId: typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef') : '1:123456789:web:abcdef',
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let googleProvider;
let phoneProvider;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
  // Initialize Firebase services
  auth = getAuth(app);
  // Initialize Firestore with ignoreUndefinedProperties to avoid write errors
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  storage = getStorage(app);
  
  // Create Google Auth Provider instance
  googleProvider = new GoogleAuthProvider();
  
  // Create Phone Auth Provider instance
  phoneProvider = new PhoneAuthProvider(auth);
  
  // Connect to emulators in development (only if Firebase is properly configured)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && missingVars.length === 0) {
    try {
      // Only connect to emulators on client side
      if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      if (db && !(db as any)._delegate._settings?.host?.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }
      if (storage && !storage.app.options.storageBucket?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
    } catch (emulatorError) {
      console.warn('⚠️ Could not connect to Firebase emulators:', emulatorError);
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create mock objects to prevent crashes
  auth = null;
  db = null;
  storage = null;
  googleProvider = null;
  phoneProvider = null;
}

export { auth, db, storage, googleProvider, phoneProvider, RecaptchaVerifier };
export default app;
