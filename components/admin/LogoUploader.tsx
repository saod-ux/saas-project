"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, Check } from "lucide-react";

interface LogoUploaderProps {
  tenantSlug: string;
  currentLogoUrl?: string | null;
  onLogoChange: (logoUrl: string | null) => void;
}

export default function LogoUploader({ 
  tenantSlug, 
  currentLogoUrl, 
  onLogoChange 
}: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

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
      
      // Firebase Storage upload is handled server-side, just get the URL
      const logoUrl = data.data.url || data.data.imageUrl;

      // Save via dedicated logo endpoint
      const saveRes = await fetch(`/api/admin/${tenantSlug}/logo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
        cache: "no-store"
      });
      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save logo to tenant");
      }

      onLogoChange(logoUrl);
      setSuccess("Logo uploaded successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploading(true);
      setError("");
      setSuccess("");
      
      // Persist removal via dedicated endpoint
      const saveRes = await fetch(`/api/admin/${tenantSlug}/logo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
        cache: "no-store"
      });
      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to remove logo from tenant");
      }

      await onLogoChange(null);
      setSuccess("Logo removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Remove logo error:", error);
      setError("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Display */}
      <div className="rounded border p-4">
        <p className="mb-2 text-sm text-muted-foreground">Logo</p>
        {currentLogoUrl ? (
          <div className="flex items-center gap-4">
            <Image 
              src={currentLogoUrl} 
              alt="Current logo" 
              width={64}
              height={64}
              className="h-16 w-16 rounded object-contain bg-muted border" 
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              {uploading ? "Removing..." : "Remove Logo"}
            </Button>
          </div>
        ) : (
          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed">
            No logo
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="rounded border p-4">
        <p className="mb-3 text-sm font-medium">Upload New Logo</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="logo-upload"
              disabled={uploading}
            />
            <label
              htmlFor="logo-upload"
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                uploading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'hover:bg-gray-50 border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Choose Image"}
            </label>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Recommended: Square image, at least 200x200px. Max size: 5MB
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}



