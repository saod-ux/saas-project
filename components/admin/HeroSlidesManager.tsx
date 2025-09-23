"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeroSlide {
  id: string;
  url: string;
  alt_en?: string;
  alt_ar?: string;
  sortOrder: number;
  isActive: boolean;
}

interface HeroSlidesManagerProps {
  tenantSlug: string;
  initial: HeroSlide[];
}

export default function HeroSlidesManager({ tenantSlug, initial }: HeroSlidesManagerProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      
      const newSlide: HeroSlide = {
        id: `tmp-${crypto.randomUUID()}`,
        url,
        alt_en: "",
        alt_ar: "",
        sortOrder: slides.length,
        isActive: true,
      };
      
      setSlides(prev => [...prev, newSlide]);
      setSuccess("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/admin/${tenantSlug}/hero/slides/bulk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      
      if (!response.ok) {
        throw new Error("Save failed");
      }
      
      setSuccess("Hero slides saved successfully!");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save hero slides");
    } finally {
      setLoading(false);
    }
  }

  function updateSlide(id: string, updates: Partial<HeroSlide>) {
    setSlides(prev => prev.map(slide => 
      slide.id === id ? { ...slide, ...updates } : slide
    ));
  }

  function deleteSlide(id: string) {
    setSlides(prev => prev.filter(slide => slide.id !== id));
  }

  function moveSlide(fromIndex: number, toIndex: number) {
    setSlides(prev => {
      const newSlides = [...prev];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);
      
      // Update sortOrder
      return newSlides.map((slide, index) => ({
        ...slide,
        sortOrder: index,
      }));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Hero Slides</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload up to 5 images for your hero carousel. Images will auto-advance every 4.5 seconds.
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
          disabled={loading || slides.length >= 5}
          className="hidden"
          id="hero-upload"
        />
        <label
          htmlFor="hero-upload"
          className={`cursor-pointer ${loading || slides.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-gray-500">
            {loading ? (
              "Uploading..."
            ) : slides.length >= 5 ? (
              "Maximum 5 slides reached"
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">Click to upload hero image</p>
                <p className="text-xs text-gray-400">PNG, JPG, WebP up to 10MB</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Slides Grid */}
      {slides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {slides.map((slide, index) => (
            <div key={slide.id} className="rounded-xl border overflow-hidden bg-white">
              <div className="relative aspect-[4/3]">
                <Image 
                  src={slide.url} 
                  alt={slide.alt_en || "hero slide"} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 50vw, 25vw" 
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={slide.isActive} 
                      onChange={(e) => updateSlide(slide.id, { isActive: e.target.checked })}
                      className="rounded"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => deleteSlide(slide.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Alt text (English)"
                    value={slide.alt_en || ""}
                    onChange={(e) => updateSlide(slide.id, { alt_en: e.target.value })}
                    className="w-full text-xs px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Alt text (Arabic)"
                    value={slide.alt_ar || ""}
                    onChange={(e) => updateSlide(slide.id, { alt_ar: e.target.value })}
                    className="w-full text-xs px-2 py-1 border rounded"
                  />
                </div>
                
                {/* Move buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => moveSlide(index, index - 1)}
                    disabled={index === 0}
                    className="flex-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSlide(index, index + 1)}
                    disabled={index === slides.length - 1}
                    className="flex-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    ↓
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
      {slides.length > 0 && (
        <button 
          onClick={onSave} 
          disabled={loading}
          className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Hero Slides"}
        </button>
      )}
    </div>
  );
}

