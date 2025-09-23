'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Firebase types
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface ConfirmationResult {
  confirm: (code: string) => Promise<any>;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Dynamically load Firebase
    const loadFirebase = async () => {
      try {
        const [firebaseAuth, firebaseClient] = await Promise.all([
          import('firebase/auth'),
          import('@/lib/firebase/client-simple')
        ]);

        const auth = firebaseClient.auth;
        const onAuthStateChanged = firebaseAuth.onAuthStateChanged;

        if (!auth || !onAuthStateChanged) {
          console.warn('⚠️ Firebase Auth is not available. Please check your Firebase configuration.');
          setLoading(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });

        setFirebaseLoaded(true);
        return unsubscribe;
      } catch (error) {
        console.warn('⚠️ Firebase initialization failed:', error);
        setLoading(false);
      }
    };

    loadFirebase();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
    
    if (!auth || !signInWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
    const updateProfile = firebaseAuth.updateProfile;
    
    if (!auth || !createUserWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && updateProfile) {
      await updateProfile(result.user, { displayName });
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const googleProvider = firebaseClient.googleProvider;
    const signInWithPopup = firebaseAuth.signInWithPopup;
    
    if (!auth || !googleProvider || !signInWithPopup) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const RecaptchaVerifier = firebaseClient.RecaptchaVerifier;
    const signInWithPhoneNumber = firebaseAuth.signInWithPhoneNumber;
    
    if (!auth || !RecaptchaVerifier || !signInWithPhoneNumber) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    // Create reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.error('reCAPTCHA expired');
      }
    });

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      recaptchaVerifier.clear();
      throw error;
    }
  };

  const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    await confirmationResult.confirm(code);
  };

  const signOutUser = async () => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const signOut = firebaseAuth.signOut;
    
    if (!auth || !signOut) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const sendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;
    
    if (!auth || !sendPasswordResetEmail) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    const [firebaseAuth, firebaseClient] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase/client-simple')
    ]);
    
    const auth = firebaseClient.auth;
    const updateProfile = firebaseAuth.updateProfile;
    
    if (!auth || !user || !updateProfile) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await updateProfile(user, updates);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneCode,
    signOutUser,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
