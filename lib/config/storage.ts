/**
 * Centralized Storage Configuration
 * 
 * This file enforces a single source of truth for all storage-related
 * configuration, including bucket names, URL formats, and environment
 * variable handling.
 */

// Storage bucket configuration
export const STORAGE_CONFIG = {
  // Primary bucket name - this is the single source of truth
  BUCKET_NAME: 'e-view-7ebc8.appspot.com',
  
  // URL format for public access
  PUBLIC_URL_BASE: 'https://storage.googleapis.com',
  
  // Environment variable names
  ENV_VARS: {
    CLIENT_BUCKET: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    SERVER_BUCKET: 'FIREBASE_STORAGE_BUCKET',
  },
} as const;

/**
 * Get the storage bucket name with fallback
 * @param isClient - Whether this is running on the client side
 * @returns The bucket name to use
 */
export function getStorageBucket(isClient: boolean = false): string {
  const envVar = isClient 
    ? process.env[STORAGE_CONFIG.ENV_VARS.CLIENT_BUCKET]
    : process.env[STORAGE_CONFIG.ENV_VARS.SERVER_BUCKET];
  
  return envVar || STORAGE_CONFIG.BUCKET_NAME;
}

/**
 * Generate a public URL for a file path
 * @param path - The file path in the bucket
 * @returns The public URL
 */
export function getPublicUrl(path: string): string {
  const bucket = getStorageBucket();
  return `${STORAGE_CONFIG.PUBLIC_URL_BASE}/${bucket}/${path}`;
}

/**
 * Validate that a URL is from our storage bucket
 * @param url - The URL to validate
 * @returns Whether the URL is from our storage bucket
 */
export function isValidStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expectedHost = STORAGE_CONFIG.PUBLIC_URL_BASE.replace('https://', '');
    return urlObj.hostname === expectedHost && urlObj.pathname.startsWith(`/${STORAGE_CONFIG.BUCKET_NAME}/`);
  } catch {
    return false;
  }
}

/**
 * Extract the file path from a storage URL
 * @param url - The storage URL
 * @returns The file path or null if invalid
 */
export function extractFilePath(url: string): string | null {
  if (!isValidStorageUrl(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(STORAGE_CONFIG.BUCKET_NAME);
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }
    
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}

/**
 * Storage configuration validation
 * @returns Object with validation results
 */
export function validateStorageConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check environment variables
  const clientBucket = process.env[STORAGE_CONFIG.ENV_VARS.CLIENT_BUCKET];
  const serverBucket = process.env[STORAGE_CONFIG.ENV_VARS.SERVER_BUCKET];
  
  if (clientBucket && clientBucket !== STORAGE_CONFIG.BUCKET_NAME) {
    warnings.push(`Client bucket env var (${STORAGE_CONFIG.ENV_VARS.CLIENT_BUCKET}) differs from default: ${clientBucket} vs ${STORAGE_CONFIG.BUCKET_NAME}`);
  }
  
  if (serverBucket && serverBucket !== STORAGE_CONFIG.BUCKET_NAME) {
    warnings.push(`Server bucket env var (${STORAGE_CONFIG.ENV_VARS.SERVER_BUCKET}) differs from default: ${serverBucket} vs ${STORAGE_CONFIG.BUCKET_NAME}`);
  }
  
  if (clientBucket && serverBucket && clientBucket !== serverBucket) {
    errors.push(`Bucket mismatch: client (${clientBucket}) vs server (${serverBucket})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
