// Server-side Firebase Auth utilities
import { serverAuth } from './server-only';

// Server-side auth functions
export const verifyIdToken = async (idToken: string) => {
  if (!serverAuth) {
    console.error('Firebase Admin Auth is not available');
    return null;
  }
  
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
};

export const getUserByUid = async (uid: string) => {
  if (!serverAuth) {
    console.error('Firebase Admin Auth is not available');
    return null;
  }
  
  try {
    const userRecord = await serverAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    return null;
  }
};

export const createUser = async (email: string, password: string, displayName?: string) => {
  if (!serverAuth) {
    throw new Error('Firebase Admin Auth is not available');
  }
  
  try {
    const userRecord = await serverAuth.createUser({
      email,
      password,
      displayName,
    });
    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (uid: string, updates: any) => {
  if (!serverAuth) {
    throw new Error('Firebase Admin Auth is not available');
  }
  
  try {
    const userRecord = await serverAuth.updateUser(uid, updates);
    return userRecord;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  if (!serverAuth) {
    throw new Error('Firebase Admin Auth is not available');
  }
  
  try {
    await serverAuth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const setCustomUserClaims = async (uid: string, claims: any) => {
  if (!serverAuth) {
    throw new Error('Firebase Admin Auth is not available');
  }
  
  try {
    await serverAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    throw error;
  }
};

// Helper function to get user from request
export const getUserFromRequest = async (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyIdToken(idToken);
  
  if (!decodedToken) {
    return null;
  }

  return await getUserByUid(decodedToken.uid);
};
