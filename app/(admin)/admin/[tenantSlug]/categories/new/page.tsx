"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CategoryCreateForm } from "@/components/admin/catalog/CategoryCreateForm";

export default function NewCategory() {
  const router = useRouter();
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('Creating category with data:', formData);
      
      const res = await fetch(`/api/admin/${tenantSlug}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setSuccess("Category created successfully!");
        setTimeout(() => {
          router.push(`/admin/${tenantSlug}/categories`);
        }, 1500);
      } else {
        setError(data.error || "Failed to create category");
      }
    } catch (error) {
      setError("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">إنشاء فئة</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded border px-3 py-2"
          >
            رجوع
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <CategoryCreateForm onSubmit={handleSubmit} onError={setError} />
    </div>
  );
}
