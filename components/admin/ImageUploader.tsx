"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
// import { createSasForUpload } from "@/lib/upload"; // Function not available

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  tenantSlug?: string;
}

export default function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  className = "",
  tenantSlug = "default"
}: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots).filter(file => file.type.startsWith('image/'));

    try {
      for (const file of filesToProcess) {
        // Use Azure upload via API endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantSlug', tenantSlug);
        
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (result.ok) {
          newImages.push(result.data.url);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }
      
      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        صور المنتج ({images.length}/{maxImages})
      </label>
      
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : uploading
              ? 'border-yellow-500 bg-yellow-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={uploading ? undefined : openFileDialog}
        >
          <Upload className={`mx-auto h-12 w-12 mb-4 ${uploading ? 'text-yellow-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 mb-2">
            {uploading ? 'جاري رفع الصور...' : 'اسحب وأفلت الصور هنا، أو انقر للاختيار'}
          </p>
          <p className="text-xs text-gray-500">
            يدعم JPG, PNG, GIF حتى 10 ميجابايت لكل صورة
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add More Button */}
      {images.length > 0 && images.length < maxImages && (
        <button
          type="button"
          onClick={openFileDialog}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ImageIcon className="h-4 w-4" />
          Add more images
        </button>
      )}
    </div>
  );
}
