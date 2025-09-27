"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizeNumericInput } from "@/lib/utils/arabic-numerals";

interface EditProductFormProps {
  tenant: any;
  tenantSlug: string;
  product: any;
  categories: any[];
}

export default function EditProductForm({ tenant, tenantSlug, product, categories }: EditProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    price: "",
    sku: "",
    status: "draft",
    primaryCategoryId: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        nameAr: product.nameAr || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        sku: product.sku || "",
        status: product.status || "draft",
        primaryCategoryId: product.primaryCategoryId || "",
        stockQuantity: product.stockQuantity?.toString() || "0",
        lowStockThreshold: product.lowStockThreshold?.toString() || "5",
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Normalize Arabic numerals
      const normalizedPrice = normalizeNumericInput(formData.price);
      const normalizedStockQuantity = normalizeNumericInput(formData.stockQuantity);
      const normalizedLowStockThreshold = normalizeNumericInput(formData.lowStockThreshold);
      
      if (!formData.name || !normalizedPrice || isNaN(Number(normalizedPrice))) {
        setError("Product name and valid price are required");
        setLoading(false);
        return;
      }

      const productData = {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description,
        price: Number(normalizedPrice),
        sku: formData.sku || null,
        status: formData.status,
        primaryCategoryId: formData.primaryCategoryId || null,
        stockQuantity: Number(normalizedStockQuantity),
        lowStockThreshold: Number(normalizedLowStockThreshold),
      };

      const response = await fetch(`/api/admin/${tenantSlug}/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.ok) {
        setSuccess("Product updated successfully!");
        setTimeout(() => {
          router.push(`/admin/${tenantSlug}/products`);
        }, 1500);
      } else {
        setError(result.error || "Failed to update product");
      }
    } catch (error) {
      setError("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link 
          href={`/admin/${tenantSlug}/products`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Product</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name (Arabic)
          </label>
          <input
            type="text"
            id="nameAr"
            name="nameAr"
            value={formData.nameAr}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product name in Arabic"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product description"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (KWD) *
          </label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter price (supports Arabic numerals: ١٢٫٥٠)"
          />
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter SKU (optional)"
          />
        </div>

        <div>
          <label htmlFor="primaryCategoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="primaryCategoryId"
            name="primaryCategoryId"
            value={formData.primaryCategoryId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="text"
              id="stockQuantity"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter stock quantity (supports Arabic numerals)"
            />
          </div>

          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="text"
              id="lowStockThreshold"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter low stock threshold"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
          <Link
            href={`/admin/${tenantSlug}/products`}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

