"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Image, Globe, Save, AlertCircle } from "lucide-react";

interface SEOFormProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  initialData: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    redirectToCustomDomain?: boolean;
    edgeCacheTTL?: number;
  };
}

export default function SEOForm({ tenant, initialData }: SEOFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    metaTitle: initialData.metaTitle || "",
    metaDescription: initialData.metaDescription || "",
    ogImageUrl: initialData.ogImageUrl || "",
    redirectToCustomDomain: initialData.redirectToCustomDomain || false,
    edgeCacheTTL: initialData.edgeCacheTTL || 60,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/platform/seo/${tenant.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.ok) {
        setSuccess("SEO settings updated successfully!");
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Failed to update SEO settings");
      }
    } catch (error) {
      setError("Failed to update SEO settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta Title */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Search className="h-4 w-4 mr-2" />
          Meta Title
        </label>
        <input
          type="text"
          value={formData.metaTitle}
          onChange={(e) => handleInputChange("metaTitle", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter meta title for search engines"
          maxLength={60}
        />
        <p className="text-xs text-gray-500">
          {formData.metaTitle.length}/60 characters. This appears in search results.
        </p>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Eye className="h-4 w-4 mr-2" />
          Meta Description
        </label>
        <textarea
          value={formData.metaDescription}
          onChange={(e) => handleInputChange("metaDescription", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter meta description for search engines"
          rows={3}
          maxLength={160}
        />
        <p className="text-xs text-gray-500">
          {formData.metaDescription.length}/160 characters. This appears in search results.
        </p>
      </div>

      {/* OpenGraph Image */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="h-4 w-4 mr-2" />
          OpenGraph Image URL
        </label>
        <input
          type="url"
          value={formData.ogImageUrl}
          onChange={(e) => handleInputChange("ogImageUrl", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-gray-500">
          Image shown when sharing on social media. Recommended size: 1200x630px
        </p>
      </div>

      {/* Custom Domain Redirect */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Globe className="h-4 w-4 mr-2" />
          Custom Domain Redirect
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="redirectToCustomDomain"
            checked={formData.redirectToCustomDomain}
            onChange={(e) => handleInputChange("redirectToCustomDomain", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="redirectToCustomDomain" className="ml-2 text-sm text-gray-700">
            Redirect to custom domain for SEO
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Enable this if the merchant has a custom domain configured
        </p>
      </div>

      {/* Edge Cache TTL */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Globe className="h-4 w-4 mr-2" />
          Edge Cache TTL (seconds)
        </label>
        <input
          type="number"
          value={formData.edgeCacheTTL}
          onChange={(e) => handleInputChange("edgeCacheTTL", parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          max="3600"
        />
        <p className="text-xs text-gray-500">
          How long to cache this page at the edge (0-3600 seconds)
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save SEO Settings"}
        </button>
      </div>
    </form>
  );
}






