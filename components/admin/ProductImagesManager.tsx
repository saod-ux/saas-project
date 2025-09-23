"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Star, StarOff, GripVertical } from "lucide-react";

type ProductImage = { 
  id: string; 
  url: string; 
  isPrimary: boolean; 
  sortOrder: number;
  width?: number;
  height?: number;
};

interface ProductImagesManagerProps {
  tenantSlug: string;
  productId: string;
  initial: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
  tenantLogoUrl?: string | null;
}

export default function ProductImagesManager({
  tenantSlug,
  productId,
  initial,
  onChange,
  tenantLogoUrl,
}: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>(initial);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    onChange?.(images);
  }, [images, onChange]);

  async function reorder(newOrder: ProductImage[]) {
    setLoading(true);
    try {
      setImages(newOrder);
      await fetch(`/api/admin/${tenantSlug}/products/${productId}/images/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map(img => img.id) }),
      });
    } catch (error) {
      console.error("Failed to reorder images:", error);
      // Revert on error
      setImages(initial);
    } finally {
      setLoading(false);
    }
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    
    if (Number.isNaN(fromIndex) || fromIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(dropIndex, 0, movedImage);

    // Update sort orders
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      sortOrder: index
    }));

    reorder(reorderedImages);
    setDraggedIndex(null);
  }

  async function makePrimary(imageId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/${tenantSlug}/products/${productId}/images/${imageId}/primary`, {
        method: "PATCH"
      });
      
      setImages(prev => prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      })));
    } catch (error) {
      console.error("Failed to set primary image:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    setLoading(true);
    try {
      await fetch(`/api/admin/${tenantSlug}/products/${productId}/images/${imageId}`, {
        method: "DELETE"
      });
      
      setImages(prev => {
        const remaining = prev.filter(img => img.id !== imageId);
        // If no primary exists, make the first one primary
        if (remaining.length > 0 && !remaining.some(img => img.isPrimary)) {
          remaining[0].isPrimary = true;
        }
        return remaining;
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setLoading(false);
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No images uploaded yet.</p>
        <p className="text-sm">Upload images using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              draggedIndex === index 
                ? 'border-blue-500 opacity-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${loading ? 'pointer-events-none opacity-50' : ''}`}
            title="Drag to reorder"
          >
            {/* Drag handle */}
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/70 text-white p-1 rounded">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-square">
              <Image
                src={img.url || tenantLogoUrl || "/placeholder.svg"}
                alt="Product image"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>

            {/* Primary badge */}
            {img.isPrimary && (
              <div className="absolute top-2 right-2">
                <div className="bg-emerald-600 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Primary
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!img.isPrimary && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 text-xs bg-black/70 text-white hover:bg-black/80"
                  onClick={() => makePrimary(img.id)}
                  disabled={loading}
                >
                  <StarOff className="w-3 h-3 mr-1" />
                  Set Primary
                </Button>
              )}
              
              <Button
                size="sm"
                variant="destructive"
                className="px-2 text-xs"
                onClick={() => removeImage(img.id)}
                disabled={loading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white rounded px-2 py-1 text-xs">Loading...</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500">
        <p>• Drag images to reorder them</p>
        <p>• The first image is automatically set as primary</p>
        <p>• Click "Set Primary" to change the main product image</p>
      </div>
    </div>
  );
}


