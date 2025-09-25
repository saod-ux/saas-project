/**
 * Environment validation utilities for debugging
 */

export interface ClientEnvValidation {
  hasApiKey: boolean;
  hasAuthDomain: boolean;
  hasProjectId: boolean;
  hasStorageBucket: boolean;
  hasMessagingSenderId: boolean;
  hasAppId: boolean;
}

export interface ServerEnvValidation {
  hasProjectId: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
}

/**
 * Validate client-side environment variables
 * Only available in browser/client components
 */
export function validateClientEnvs(): ClientEnvValidation {
  if (typeof window === 'undefined') {
    throw new Error('validateClientEnvs can only be called on client side');
  }

  const validation = {
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  console.log("[EnvProbe] client", validation);
  return validation;
}

/**
 * Validate server-side environment variables
 * Only available on server side
 */
export function validateServerEnvs(): ServerEnvValidation {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnvs can only be called on server side');
  }

  const validation = {
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  };

  console.log("[EnvProbe] server", validation);
  return validation;
}

/**
 * Get masked client environment values for debugging
 */
export function getMaskedClientEnvs() {
  if (typeof window === 'undefined') {
    throw new Error('getMaskedClientEnvs can only be called on client side');
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
      ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 6)}•••` 
      : 'MISSING',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID 
      ? `${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 10)}•••` 
      : 'MISSING',
  };
}

/**
 * Get masked server environment values for debugging
 */
export function getMaskedServerEnvs() {
  if (typeof window !== 'undefined') {
    throw new Error('getMaskedServerEnvs can only be called on server side');
  }

  return {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'MISSING',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL 
      ? process.env.FIREBASE_CLIENT_EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2')
      : 'MISSING',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY 
      ? `length=${process.env.FIREBASE_PRIVATE_KEY.length}`
      : 'MISSING',
  };
}
