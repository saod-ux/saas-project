// Client-side Firebase Auth utilities
import { auth, googleProvider } from './client';

// Re-export auth instance
export { auth };
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

// Auth provider instances
export { googleProvider };

// Client-side auth functions
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result;
};

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signOutUser = async () => {
  return await signOut(auth);
};

export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(auth, email);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
