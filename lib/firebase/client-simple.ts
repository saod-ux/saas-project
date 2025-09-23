// Simple client-side Firebase configuration without process.env
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getStorageBucket } from '@/lib/config/storage';

// Firebase configuration - using environment variables at build time
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-app',
  storageBucket: getStorageBucket(true),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

// Initialize Firebase
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let googleProvider: any = null;
let phoneProvider: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  phoneProvider = new PhoneAuthProvider(auth);
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  // Set to null for graceful degradation
  auth = null;
  db = null;
  storage = null;
  googleProvider = null;
  phoneProvider = null;
}

export { auth, db, storage, googleProvider, phoneProvider, RecaptchaVerifier };
