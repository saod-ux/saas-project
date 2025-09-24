"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Move, Play, Image as ImageIcon, Video } from "lucide-react";

interface HeroMediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  poster?: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface HeroMediaManagerProps {
  tenantSlug: string;
  initial: HeroMediaItem[];
  onSaved?: () => void;
}

export default function HeroMediaManager({ tenantSlug, initial, onSaved }: HeroMediaManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<HeroMediaItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function persistSlides(currentItems: HeroMediaItem[]) {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/admin/${tenantSlug}/hero/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: currentItems.map(item => ({
            type: item.type,
            url: item.url,
            sortOrder: item.sortOrder,
            width: item.width ?? 0,
            height: item.height ?? 0,
            alt: item.alt ?? ''
          }))
        }),
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      setSuccess("Hero updated");
      setTimeout(() => setSuccess(""), 1500);
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Persist slides error:", error);
      setError("Failed to save changes");
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(file: File) {
    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantSlug", tenantSlug);

      const response = await fetch("/api/uploads", { 
        method: "POST", 
        body: formData, 
        cache: "no-store" 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      // If we have an uploadUrl (Azure), upload the file directly
      if (data.data.uploadUrl) {
        const uploadResponse = await fetch(data.data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload to Azure: ${uploadResponse.statusText}`);
        }
      }
      
      const url = data.data.url;
      
      // Determine file type
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      
      const newItem: HeroMediaItem = {
        id: `tmp-${crypto.randomUUID()}`,
        url,
        type,
        poster: type === 'video' ? url : undefined, // Use first frame as poster for videos
        sortOrder: items.length,
        isActive: true,
        updatedAt: new Date().toISOString(),
        width: 0,
        height: 0,
        alt: type === 'image' ? file.name : 'video',
      };
      
      setItems(prev => [...prev, newItem]);
      setSuccess(`${type === 'video' ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload media");
    } finally {
      setLoading(false);
    }
  }


  async function onSave() {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/admin/${tenantSlug}/hero/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slides: items.map(item => ({
            type: item.type,
            url: item.url,
            sortOrder: item.sortOrder,
            width: item.width ?? 0,
            height: item.height ?? 0,
            alt: item.alt ?? ''
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error("Save failed");
      }
      
      setSuccess("Hero media saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      if (onSaved) {
        onSaved(); // Refresh the parent appearance data
      }
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save hero media");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(id: string, updates: Partial<HeroMediaItem>) {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }

  function deleteItem(id: string) {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id).map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
      // Immediately persist deletion
      void persistSlides(filtered);
      return filtered;
    });
  }

  function moveItem(fromIndex: number, toIndex: number) {
    setItems(prev => {
      const newItems = [...prev];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      
      // Update sortOrder
      return newItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
    });
  }

  const activeItems = items.filter(item => item.isActive);
  const hasMultipleActive = activeItems.length > 1;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Hero Media Manager</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload images or videos for your hero section. {hasMultipleActive && "Multiple active items will create a carousel that auto-advances every 4.5 seconds."}
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
          disabled={loading}
          className="hidden"
          id="hero-media-upload"
        />
        <label
          htmlFor="hero-media-upload"
          className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-gray-500">
            {loading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm">Click to upload hero media</p>
                <p className="text-xs text-gray-400">Images (PNG, JPG, WebP) or Videos (MP4, WebM) up to 50MB</p>
              </>
            )}
          </div>
        </label>
      </div>


      {/* Media Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-xl border overflow-hidden bg-white">
              <div className="relative aspect-[16/9]">
                {item.type === 'image' ? (
                  <Image 
                    src={item.url} 
                    alt="Hero media" 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                  />
                ) : (
                  <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                    <video
                      src={item.url}
                      poster={item.poster}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white bg-black/50 rounded-full p-1" />
                    </div>
                  </div>
                )}
                
                {/* Type indicator */}
                <div className="absolute top-2 left-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    {item.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                    {item.type}
                  </span>
                </div>
                
                {/* Order indicator */}
                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </span>
                </div>
              </div>
              
              <div className="p-3 space-y-3">
                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={item.isActive} 
                      onChange={(e) => updateItem(item.id, { isActive: e.target.checked })}
                      className="rounded"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                
                {/* Move buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-1"
                  >
                    <Move className="h-3 w-3" />
                    Up
                  </button>
                  <button
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-1"
                  >
                    <Move className="h-3 w-3 rotate-180" />
                    Down
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
          {success}
        </div>
      )}

      {/* Save Button */}
      {items.length > 0 && (
        <button 
          onClick={onSave} 
          disabled={loading}
          className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Hero Media"}
        </button>
      )}
    </div>
  );
}
