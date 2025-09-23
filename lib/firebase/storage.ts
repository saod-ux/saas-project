// Client-side imports (only on client)
let storage: any = null;
let ref: any = null;
let uploadBytes: any = null;
let getDownloadURL: any = null;
let deleteObject: any = null;
let getMetadata: any = null;

if (typeof window !== 'undefined') {
  try {
    const { storage: _storage } = require('./client');
    const { ref: _ref, uploadBytes: _uploadBytes, getDownloadURL: _getDownloadURL, deleteObject: _deleteObject, getMetadata: _getMetadata } = require('firebase/storage');
    storage = _storage;
    ref = _ref;
    uploadBytes = _uploadBytes;
    getDownloadURL = _getDownloadURL;
    deleteObject = _deleteObject;
    getMetadata = _getMetadata;
  } catch (error) {
    console.warn('Firebase client storage not available:', error);
  }
}

// Server-side imports (only on server)
let serverStorage: any = null;
let adminGetDownloadURL: any = null;
let adminUploadBytes: any = null;
let adminDeleteObject: any = null;

if (typeof window === 'undefined') {
  try {
    const { serverStorage: _serverStorage } = require('./server-only');
    const { getDownloadURL: _adminGetDownloadURL, uploadBytes: _adminUploadBytes, deleteObject: _adminDeleteObject } = require('firebase-admin/storage');
    serverStorage = _serverStorage;
    adminGetDownloadURL = _adminGetDownloadURL;
    adminUploadBytes = _adminUploadBytes;
    adminDeleteObject = _adminDeleteObject;
  } catch (error) {
    console.warn('Firebase Admin Storage not available:', error);
  }
}

// Client-side storage functions
export const uploadFile = async (path: string, file: File, metadata?: any) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return { downloadURL, snapshot };
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
  return true;
};

export const getFileMetadata = async (path: string) => {
  const storageRef = ref(storage, path);
  return await getMetadata(storageRef);
};

// Server-side storage functions
export const adminUploadFile = async (path: string, buffer: Buffer, metadata?: any) => {
  if (!serverStorage || !adminGetDownloadURL || !adminUploadBytes) {
    throw new Error('Firebase Admin Storage is not available');
  }
  const bucket = serverStorage.bucket();
  const file = bucket.file(path);
  
  await file.save(buffer, {
    metadata: {
      contentType: metadata?.contentType || 'application/octet-stream',
      ...metadata,
    },
  });
  
  const downloadURL = await adminGetDownloadURL(file);
  return { downloadURL, file };
};

export const adminDeleteFile = async (path: string) => {
  if (!serverStorage || !adminDeleteObject) {
    throw new Error('Firebase Admin Storage is not available');
  }
  const bucket = serverStorage.bucket();
  const file = bucket.file(path);
  await adminDeleteObject(file);
  return true;
};

export const adminGetFileMetadata = async (path: string) => {
  if (!serverStorage) {
    throw new Error('Firebase Admin Storage is not available');
  }
  const bucket = serverStorage.bucket();
  const file = bucket.file(path);
  const [metadata] = await file.getMetadata();
  return metadata;
};

// Helper function to generate unique file path
export const generateFilePath = (tenantId: string, folder: string, filename: string) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  return `tenants/${tenantId}/${folder}/${timestamp}-${randomString}.${extension}`;
};

// Helper function to validate file type
export const validateFileType = (file: File, allowedTypes: string[]) => {
  return allowedTypes.includes(file.type);
};

// Helper function to validate file size
export const validateFileSize = (file: File, maxSizeInMB: number) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};
