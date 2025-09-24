"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHelp } from "@/components/admin/PageHelp";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnOffer: boolean;
  featured: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  primaryCategoryId?: string;
  images?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
  primaryCategory?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function EditProduct() {
  const { tenantSlug, id } = useParams() as { tenantSlug: string; id: string };
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/${tenantSlug}/products/${id}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.ok) {
          setProduct(data.data);
        } else {
          alert(data.error || "Failed to fetch product");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to fetch product");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/admin/${tenantSlug}/categories`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.ok) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchProduct();
    fetchCategories();
  }, [id, tenantSlug, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    try {
      console.log('Sending product data:', product); // Debug log
      const response = await fetch(`/api/admin/${tenantSlug}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await response.json();
      
      if (data.ok) {
        alert("Product updated successfully");
        router.push(`/admin/${tenantSlug}/products`);
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.ok) {
        alert("Product deleted successfully");
        router.push(`/admin/${tenantSlug}/products`);
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Product not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <div className="flex items-center gap-2">
          <PageHelp pageKey="products.edit" locale="en" />
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
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={product.title}
                onChange={(e) => setProduct({...product, title: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={product.primaryCategoryId || ""}
                onChange={(e) => setProduct({...product, primaryCategoryId: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
                  className="w-full border rounded-l px-3 py-2"
                  required
                />
                <select
                  value={product.currency}
                  onChange={(e) => setProduct({...product, currency: e.target.value})}
                  className="border border-l-0 rounded-r px-3 py-2"
                >
                  <option value="KWD">KWD</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={product.description}
              onChange={(e) => setProduct({...product, description: e.target.value})}
              className="w-full border rounded px-3 py-2 h-24"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={product.status}
                onChange={(e) => setProduct({...product, status: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                value={product.stockQuantity || 0}
                onChange={(e) => setProduct({...product, stockQuantity: parseInt(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
              <input
                type="number"
                value={product.lowStockThreshold || 5}
                onChange={(e) => setProduct({...product, lowStockThreshold: parseInt(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="rounded border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Features</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.isBestSeller}
                onChange={(e) => setProduct({...product, isBestSeller: e.target.checked})}
                className="mr-2"
              />
              Best Seller
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.isNewArrival}
                onChange={(e) => setProduct({...product, isNewArrival: e.target.checked})}
                className="mr-2"
              />
              New Arrival
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.isOnOffer}
                onChange={(e) => setProduct({...product, isOnOffer: e.target.checked})}
                className="mr-2"
              />
              On Offer
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.featured}
                onChange={(e) => setProduct({...product, featured: e.target.checked})}
                className="mr-2"
              />
              Featured
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded bg-red-600 text-white px-4 py-2 hover:bg-red-700"
            disabled={saving}
          >
            Delete Product
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


