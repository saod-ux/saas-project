'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { 
  ConfirmationResult, 
  Auth, 
  User as FirebaseUser
} from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  RecaptchaVerifier
} from 'firebase/auth';
// Import with proper typing
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
import { auth, googleProvider } from '@/lib/firebase/client';

// Type the imported auth and googleProvider
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
const typedAuth = auth as Auth | null;
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
const typedGoogleProvider = googleProvider as GoogleAuthProvider | null;

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseLoaded, setFirebaseLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptcha, setRecaptcha] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (!typedAuth || !onAuthStateChanged) {
      console.warn('⚠️ Firebase Auth is not available. Please check your Firebase configuration.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(typedAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    setFirebaseLoaded(true);
    return unsubscribe;
  }, []);

  // Cleanup reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptcha) {
        recaptcha.clear();
      }
    };
  }, [recaptcha]);

  const signIn = async (email: string, password: string) => {
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }
    
    if (!typedAuth || !signInWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await signInWithEmailAndPassword(typedAuth, email, password);
    } catch (error: any) {
      setError(error.message || 'Sign in failed');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!typedAuth || !createUserWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(typedAuth, email, password);
      if (displayName && updateProfile) {
        await updateProfile(result.user, { displayName });
      }
    } catch (error: any) {
      setError(error.message || 'Sign up failed');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!typedAuth || !typedGoogleProvider || !signInWithPopup) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await signInWithPopup(typedAuth, typedGoogleProvider);
    } catch (error: any) {
      setError(error.message || 'Google sign in failed');
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<any> => {
    if (!typedAuth || !signInWithPhoneNumber) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    // Clear any existing reCAPTCHA verifier
    if (recaptcha) {
      recaptcha.clear();
    }
    
    // Create reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier(typedAuth, 'recaptcha-container', {
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
      setError(null);
      setRecaptcha(recaptchaVerifier);
      const confirmationResult = await signInWithPhoneNumber(typedAuth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      recaptchaVerifier.clear();
      setRecaptcha(null);
      setError(error.message || 'Phone sign in failed');
      throw error;
    }
  };

  const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    if (!typedAuth) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await confirmationResult.confirm(code);
    } catch (error: any) {
      setError(error.message || 'Phone verification failed');
      throw error;
    }
  };

  const signOutUser = async () => {
    if (!typedAuth || !signOut) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await signOut(typedAuth);
    } catch (error: any) {
      setError(error.message || 'Sign out failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!typedAuth || !sendPasswordResetEmail) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await sendPasswordResetEmail(typedAuth, email);
    } catch (error: any) {
      setError(error.message || 'Password reset failed');
      throw error;
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!typedAuth || !user || !updateProfile) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    try {
      setError(null);
      await updateProfile(user, updates);
    } catch (error: any) {
      setError(error.message || 'Profile update failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
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
