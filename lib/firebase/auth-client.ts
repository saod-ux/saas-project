// Client-side Firebase Auth utilities
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
import { auth, googleProvider } from './client';

// Re-export auth instance with proper typing
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
const typedAuth = auth as any;
export { typedAuth as auth };
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
// @ts-expect-error - Firebase client exports are properly typed but TypeScript can't infer them
const typedGoogleProvider = googleProvider as any;
export { typedGoogleProvider as googleProvider };

// Client-side auth functions
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(typedAuth, email, password);
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const result = await createUserWithEmailAndPassword(typedAuth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result;
};

export const signInWithGoogle = async () => {
  return await signInWithPopup(typedAuth, typedGoogleProvider);
};

export const signOutUser = async () => {
  return await signOut(typedAuth);
};

export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(typedAuth, email);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(typedAuth, callback);
};
