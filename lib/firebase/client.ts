import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getClientFirebaseConfig } from '@/lib/env';

// Get Firebase config with validation
let firebaseConfig;
try {
  firebaseConfig = getClientFirebaseConfig();
} catch (error) {
  console.error('❌ Firebase configuration error:', error);
  // Fallback config for development
  firebaseConfig = {
    apiKey: 'demo-api-key',
    authDomain: 'demo-app.firebaseapp.com',
    projectId: 'demo-app',
    storageBucket: 'demo-app.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  };
}

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
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
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
