import { prismaRW } from './db'

export interface PresignedUploadData {
  url: string
  fields: Record<string, string>
  key: string
}

export interface FileMetadata {
  filename: string
  mimeType: string
  size: number
  uploadedBy: string
}

// Generate a unique file key for R2
export function generateFileKey(tenantId: string, filename: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = filename.split('.').pop() || 'bin'
  return `tenants/${tenantId}/files/${timestamp}-${randomId}.${extension}`
}

// Create presigned upload URL for R2
export async function createPresignedUpload(
  tenantId: string,
  filename: string,
  mimeType: string,
  fileSize: number
): Promise<PresignedUploadData> {
  // For now, we'll create a stub implementation
  // In production, this would use AWS SDK or R2 SDK to generate presigned POST
  
  const key = generateFileKey(tenantId, filename)
  
  // Stub presigned data - replace with actual R2 SDK call
  const presignedData: PresignedUploadData = {
    url: `${process.env.R2_PUBLIC_URL || 'https://your-bucket.r2.cloudflarestorage.com'}`,
    fields: {
      key,
      'Content-Type': mimeType,
      'x-amz-meta-tenant-id': tenantId,
      'x-amz-meta-uploaded-by': 'stub-user-id'
    },
    key
  }

  console.log('Generated presigned upload (stub):', {
    tenantId,
    filename,
    key,
    usingRO: !!process.env.READONLY_DATABASE_URL
  })

  return presignedData
}

// Record file upload in database
export async function recordFileUpload(
  tenantId: string,
  key: string,
  metadata: FileMetadata
): Promise<string> {
  const file = await prismaRW.file.create({
    data: {
      tenantId,
      key,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      size: metadata.size,
      uploadedBy: metadata.uploadedBy,
      metadata: {}
    }
  })

  return file.id
}

// Attach file to product
export async function attachFileToProduct(
  productId: string,
  fileId: string,
  alt?: string,
  order: number = 0
): Promise<void> {
  await prismaRW.productImage.create({
    data: {
      productId,
      fileId,
      alt,
      order
    }
  })
}

// Get file by ID with tenant isolation
export async function getFile(fileId: string, tenantId: string) {
  return await prismaRW.file.findFirst({
    where: { id: fileId, tenantId }
  })
}

// Delete file and clean up
export async function deleteFile(fileId: string, tenantId: string): Promise<void> {
  // Delete product images first
  await prismaRW.productImage.deleteMany({
    where: { fileId }
  })

  // Delete file record
  await prismaRW.file.delete({
    where: { id: fileId, tenantId }
  })

  // TODO: Delete from R2 storage
  console.log('File deleted from database, R2 cleanup needed for:', fileId)
}
