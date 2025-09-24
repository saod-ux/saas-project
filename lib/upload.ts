import { uploadFile as firebaseUploadFile, deleteFile as firebaseDeleteFile } from './firebase/storage'
import { v4 as uuidv4 } from 'uuid'

export interface FileMetadata {
  filename: string
  mimeType: string
  size: number
  uploadedBy: string
}

export interface UploadImage {
  url: string
  width: number
  height: number
  alt: string
}

export interface UploadResult {
  fileId: string
  publicUrl: string
  path: string
  image: UploadImage
}

export async function createUploadPath(
  tenantSlug: string,
  filename: string
): Promise<string> {
  // Generate path with date structure: tenants/{tenantSlug}/uploads/YYYY/MM/{uuid}.{ext}
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const fileExt = filename.split('.').pop() || 'bin'
  const uuid = uuidv4()
  return `tenants/${tenantSlug}/uploads/${year}/${month}/${uuid}.${fileExt}`
}

export async function uploadFile(
  file: File,
  fileType: string,
  tenantId: string,
  metadata: FileMetadata
): Promise<UploadResult> {
  const path = await createUploadPath(tenantId, file.name)
  const uploadResult = await firebaseUploadFile(path, file, fileType)

  // Ensure we have a proper download URL with token
  let downloadURL = uploadResult.downloadURL;
  if (!downloadURL || downloadURL.startsWith('gs://')) {
    throw new Error('Invalid download URL received from upload');
  }

  // Basic width/height are unknown here; callers can update later after rendering
  const image: UploadImage = {
    url: downloadURL,
    width: 0,
    height: 0,
    alt: metadata.filename || 'uploaded image'
  }

  return {
    fileId: path,
    publicUrl: downloadURL,
    path,
    image
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    await firebaseDeleteFile(fileId)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

export async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    // For now, return the fileId as URL (this should be implemented properly)
    return fileId
  } catch (error) {
    console.error('Error getting file URL:', error)
    return null
  }
}