'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';

// Firebase types

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
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    if (!auth || !signInWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!auth || !createUserWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && updateProfile) {
      await updateProfile(result.user, { displayName });
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider || !signInWithPopup) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
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
    if (!auth) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    await confirmationResult.confirm(code);
  };

  const signOutUser = async () => {
    if (!auth || !signOut) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth || !sendPasswordResetEmail) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
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
