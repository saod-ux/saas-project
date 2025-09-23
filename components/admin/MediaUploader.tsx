"use client";

import { useState, useEffect } from "react";

interface MediaUploaderProps {
  tenantId: string;
  prefix: string; // e.g. `tenants/${tenantId}/products/${productId}`
  onUploaded: (files: {url: string}[]) => void;
  maxImages?: number;
  className?: string;
  tenantSlug?: string; // For fetching media settings
}

interface MediaSettings {
  maxImageMB: number;
  allowedImageTypes: string;
}

export default function MediaUploader({
  tenantId,
  prefix,
  onUploaded,
  maxImages = 5,
  className = "",
  tenantSlug
}: MediaUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [mediaSettings, setMediaSettings] = useState<MediaSettings>({
    maxImageMB: 10,
    allowedImageTypes: "image/jpeg,image/png,image/webp"
  });

  // Fetch media settings
  useEffect(() => {
    if (tenantSlug) {
      fetch(`/api/v1/tenant-settings?tenantSlug=${encodeURIComponent(tenantSlug)}`)
        .then(res => res.json())
        .then(data => {
          if (data.tenant?.settings?.media) {
            setMediaSettings(data.tenant.settings.media);
          }
        })
        .catch(error => {
          console.warn("Could not fetch media settings:", error);
        });
    }
  }, [tenantSlug]);

  // Client-side validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = mediaSettings.allowedImageTypes.split(",");
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
    }

    const maxSizeBytes = mediaSettings.maxImageMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${mediaSettings.maxImageMB}MB`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setBusy(true);
    setUploadProgress({});
    const uploadedFiles: {url: string}[] = [];
    const filesToProcess = Array.from(files).slice(0, maxImages).filter(file => file.type.startsWith('image/'));

    // Client-side validation
    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(`Validation failed for ${file.name}: ${validationError}`);
        setBusy(false);
        return;
      }
    }

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const fileId = `${file.name}-${i}`;
        
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        const key = `${prefix}/${Date.now()}-${file.name}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", key);
        if (tenantSlug) {
          formData.append("tenantSlug", tenantSlug);
        }
        
        // Simulate progress (since we can't track actual upload progress with fetch)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
          }));
        }, 100);
        
        const response = await fetch("/api/uploads", { 
          method: "POST", 
          body: formData 
        });
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        if (!response.ok) {
          const errorText = await response.text();
          alert(`Upload failed for ${file.name}: ${errorText}`);
          setBusy(false);
          return;
        }
        
        const { url } = await response.json();
        uploadedFiles.push({ url });
      }

      onUploaded(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setBusy(false);
      setUploadProgress({});
    }
  };

  return (
    <div className={className}>
      <input 
        type="file" 
        multiple 
        accept={mediaSettings.allowedImageTypes}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        disabled={busy}
      />
      
      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-2 space-y-1">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{fileId.split('-')[0]}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Settings info */}
      <div className="text-xs text-gray-500 mt-2">
        Max size: {mediaSettings.maxImageMB}MB • 
        Allowed: {mediaSettings.allowedImageTypes.split(',').map(t => t.split('/')[1].toUpperCase()).join(', ')}
      </div>
    </div>
  );
}
