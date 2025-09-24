"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import MediaUploader from "@/components/admin/MediaUploader";

interface ImageObj { url: string; width?: number; height?: number; alt?: string }
interface CategoryImagePickerProps {
  tenantSlug: string;
  tenantId: string;
  categoryId: string;
  currentImage?: ImageObj | null;
  tenantLogo?: ImageObj | null;
  onChange?: (image: ImageObj | null) => void;
}

export default function CategoryImagePicker({
  tenantSlug,
  tenantId,
  categoryId,
  currentImage,
  tenantLogo,
  onChange,
}: CategoryImagePickerProps) {
  const [preview, setPreview] = useState<ImageObj | null>(currentImage ?? null);
  const [loading, setLoading] = useState(false);

  async function saveImage(image: ImageObj | null) {
    setLoading(true);
    try {
      setPreview(image);
      onChange?.(image);
      
      const response = await fetch(`/api/admin/${tenantSlug}/categories/${categoryId}/image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image ? { url: image.url, width: image.width ?? 0, height: image.height ?? 0, alt: image.alt ?? '' } : null }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Failed to save category image: ${errorText}`);
        // Revert on error
        setPreview(currentImage ?? null);
      }
    } catch (error) {
      console.error("Failed to save category image:", error);
      // Revert on error
      setPreview(currentImage ?? null);
    } finally {
      setLoading(false);
    }
  }

  function useLogoFallback() {
    saveImage(null); // null means use logo fallback
  }

  const displayImage = preview?.url || tenantLogo?.url || null;
  const isUsingLogo = !preview && !!tenantLogo?.url;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative w-full max-w-xs aspect-[4/3] overflow-hidden rounded-lg border-2 border-gray-200">
        {displayImage ? (
          <Image
            src={displayImage}
            alt="Category image"
            fill
            className={`${preview ? "object-cover" : "object-contain bg-gray-100 p-6"}`}
            sizes="(max-width: 640px) 100vw, 320px"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Status indicator */}
        {isUsingLogo && (
          <div className="absolute top-2 right-2">
            <div className="bg-blue-600 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Logo
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white rounded px-3 py-2 text-sm">Saving...</div>
          </div>
        )}
      </div>

      {/* Upload section */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Upload Category Image</div>
        
        <MediaUploader
          tenantId={tenantId}
          prefix={`tenants/${tenantId}/categories/${categoryId}`}
          onUploaded={(files) => {
            if (files?.[0]?.url) {
              saveImage({ url: files[0].url, width: files[0].width ?? 0, height: files[0].height ?? 0, alt: 'category' });
            }
          }}
          maxImages={1}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={useLogoFallback}
            disabled={loading || !!isUsingLogo}
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Use Logo Instead
          </Button>
        </div>
      </div>

      {/* Help text */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>• Upload a custom image for this category</p>
        <p>• If no image is uploaded, the tenant logo will be used automatically</p>
        <p>• Recommended size: 800x600px or similar 4:3 aspect ratio</p>
      </div>
    </div>
  );
}
