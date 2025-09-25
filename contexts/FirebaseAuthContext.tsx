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
import { auth } from '@/lib/firebase/client';

// Create Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();

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
  createSession: (idToken: string) => Promise<{ platformRole?: string; tenantRole?: string; tenantSlug?: string }>;
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

    console.log('🔍 Firebase Auth Context - Initializing...', { auth: !!auth, onAuthStateChanged: !!onAuthStateChanged });

    if (!auth || !onAuthStateChanged) {
      console.warn('⚠️ Firebase Auth is not available. Please check your Firebase configuration.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔍 Firebase Auth State Changed:', { user: !!user, uid: user?.uid });
      setUser(user);
      setLoading(false);
    });

    setFirebaseLoaded(true);
    console.log('✅ Firebase Auth Context - Initialized successfully');
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

  const createSession = async (idToken: string) => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      return data.roles || {};
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔍 Sign In Attempt:', { email, firebaseLoaded, auth: !!auth, signInWithEmailAndPassword: !!signInWithEmailAndPassword });
    
    if (!firebaseLoaded) {
      throw new Error('Firebase is not loaded yet. Please try again.');
    }

    if (!auth || !signInWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }

    try {
      setError(null);
      console.log('🔍 Attempting Firebase sign in...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign in successful:', { uid: result.user.uid });
      
      // Get current user and force fresh token
      const user = auth.currentUser;
      if (!user) throw new Error("No currentUser after sign-in");
      
      // Force refresh to avoid stale/malformed tokens
      const idToken = await user.getIdToken(true);
      
      console.log("[CLIENT] Got ID token", {
        tokenLength: idToken?.length ?? 0,
        start: idToken?.slice(0, 20),
        end: idToken?.slice(-20),
      });
      
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      });
      
      const data = await res.json();
      console.log("[CLIENT] Session response", { status: res.status, data });
      
      if (!res.ok) {
        throw new Error(data.error || 'Session creation failed');
      }
      
      console.log('✅ Session created successfully');
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      setError(error.message || 'Sign in failed');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!auth || !createUserWithEmailAndPassword) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }

    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && updateProfile) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create session after successful sign-up
      const idToken = await result.user.getIdToken();
      await createSession(idToken);
    } catch (error: any) {
      setError(error.message || 'Sign up failed');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider || !signInWithPopup) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }

    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create session after successful Google sign-in
      const idToken = await result.user.getIdToken();
      await createSession(idToken);
    } catch (error: any) {
      setError(error.message || 'Google sign in failed');
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<any> => {
    if (!auth || !signInWithPhoneNumber) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }
    
    // Clear any existing reCAPTCHA verifier
    if (recaptcha) {
      recaptcha.clear();
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
      setError(null);
      setRecaptcha(recaptchaVerifier);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      recaptchaVerifier.clear();
      setRecaptcha(null);
      setError(error.message || 'Phone sign in failed');
      throw error;
    }
  };

  const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    if (!auth) {
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
    if (!auth || !signOut) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }

    try {
      setError(null);
      
      // Clear session cookies first
      await fetch('/api/auth/session', { method: 'DELETE' });
      
      // Then sign out from Firebase
      await signOut(auth);
    } catch (error: any) {
      setError(error.message || 'Sign out failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth || !sendPasswordResetEmail) {
      throw new Error('Firebase Auth is not available. Please check your configuration.');
    }

    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message || 'Password reset failed');
      throw error;
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!auth || !user || !updateProfile) {
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
    createSession,
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
