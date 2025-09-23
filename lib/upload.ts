import { uploadFile as firebaseUploadFile, deleteFile as firebaseDeleteFile } from './firebase/storage'
import { v4 as uuidv4 } from 'uuid'

export interface FileMetadata {
  filename: string
  mimeType: string
  size: number
  uploadedBy: string
}

export interface UploadResult {
  fileId: string
  publicUrl: string
  path: string
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
  const publicUrl = await firebaseUploadFile(path, file, fileType)
  
  return {
    fileId: path,
    publicUrl,
    path
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