"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PageHelp } from "@/components/admin/PageHelp";

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  _count: {
    products: number;
  };
}

export default function EditCategory() {
  const { tenantSlug, id } = useParams() as { tenantSlug: string; id: string };
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/admin/${tenantSlug}/categories/${id}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.ok) {
          // Convert null values to empty strings for form handling
          const categoryData = {
            ...data.data,
            description: data.data.description || "",
            imageUrl: data.data.imageUrl || ""
          };
          setCategory(categoryData);
        } else {
          alert(data.error || "Failed to fetch category");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        alert("Failed to fetch category");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, tenantSlug, router]);

  // Generate slug from name, handling both English and Arabic text
  const generateSlug = (name: string) => {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // Include Arabic characters
      .replace(/(^-|-$)+/g, "");
    
    // If slug is empty (e.g., for Arabic-only text), generate a fallback
    if (!slug) {
      slug = `category-${Date.now()}`;
    }
    
    return slug;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setSaving(true);
    try {
      // Auto-generate slug if it's empty or matches the old name
      const updatedCategory = {
        ...category,
        slug: category.slug || generateSlug(category.name),
        description: category.description || "",
        imageUrl: category.imageUrl || ""
      };

      console.log('Saving category with data:', updatedCategory);

      const response = await fetch(`/api/admin/${tenantSlug}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCategory),
      });
      const data = await response.json();
      
      if (data.ok) {
        alert("Category updated successfully");
        router.push(`/admin/${tenantSlug}/categories`);
      } else {
        alert(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category? This will also remove it from all products.")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/categories/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.ok) {
        alert("Category deleted successfully");
        router.push(`/admin/${tenantSlug}/categories`);
      } else {
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading category...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Category not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Category</h1>
        <div className="flex items-center gap-2">
          <PageHelp pageKey="categories.edit" locale="en" />
          <button
            onClick={() => router.back()}
            className="rounded border px-3 py-2"
          >
            Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={category.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const newSlug = generateSlug(newName);
                  setCategory({...category, name: newName, slug: newSlug});
                }}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={category.slug}
                onChange={(e) => setCategory({...category, slug: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={category.description}
              onChange={(e) => setCategory({...category, description: e.target.value})}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input
                type="number"
                value={category.sortOrder}
                onChange={(e) => setCategory({...category, sortOrder: parseInt(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={category.isActive}
                  onChange={(e) => setCategory({...category, isActive: e.target.checked})}
                  className="mr-2"
                />
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="rounded border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Category Image</h2>
          
          <div className="flex items-center gap-4">
            {category.imageUrl ? (
              <div className="w-20 h-20 rounded-lg bg-neutral-200 overflow-hidden">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                No Image
              </div>
            )}
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('type', 'category');
                  formData.append('tenantSlug', tenantSlug);

                  try {
                    const response = await fetch(`/api/uploads`, {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await response.json();
                    console.log('Upload response:', data);
                    if (data.ok && data.data && data.data.url) {
                      console.log('Setting imageUrl to:', data.data.url);
                      setCategory({...category, imageUrl: data.data.url});
                    } else {
                      console.error('No URL in response:', data);
                      alert('Upload failed: ' + (data.error || 'Unknown error'));
                    }
                  } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Failed to upload image');
                  }
                }}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a new image for this category
              </p>
            </div>
          </div>
        </div>

        <div className="rounded border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Statistics</h2>
          <div className="text-sm text-gray-600">
            This category contains <strong>{category._count.products}</strong> products.
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded bg-red-600 text-white px-4 py-2 hover:bg-red-700"
            disabled={saving}
          >
            Delete Category
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border px-4 py-2"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-black text-white px-4 py-2 hover:bg-gray-800"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


