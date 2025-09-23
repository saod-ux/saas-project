"use client";

import { useState, useRef } from "react";

interface MediaUploaderProps {
  tenantId: string;
  productId?: string;
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export default function MediaUploader({
  tenantId,
  productId,
  onUpload,
  onError,
  accept = "image/*",
  maxSize = 5,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      onError?.("Invalid file type");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const filename = `${timestamp}.${extension}`;

      // Create file path
      const filePath = productId
        ? `tenants/${tenantId}/products/${productId}/${filename}`
        : `tenants/${tenantId}/uploads/${filename}`;

      // Use Azure upload via API endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantSlug', tenantId);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (result.ok) {
        setProgress(100);
        onUpload(result.data.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="w-full">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              Click to upload or drag and drop
            </div>
            <div className="text-xs text-gray-500">
              {accept} up to {maxSize}MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

