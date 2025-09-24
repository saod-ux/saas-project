"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ImageUploader from "@/components/admin/ImageUploader";

interface Category {
  id: string;
  name: string;
}

export default function NewProduct() {
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    compareAtPrice: "",
    currency: "KWD",
    prepTimeDays: "",
    status: "ACTIVE",
    primaryCategoryId: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Array<{
    id: string;
    title: string;
    options: string[];
  }>>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/admin/${tenantSlug}/categories`);
        const data = await response.json();
        if (data.ok) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [tenantSlug]);

  // Custom fields management functions
  const addCustomField = () => {
    const newField = {
      id: Date.now().toString(),
      title: "",
      options: [""]
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields(customFields.filter(field => field.id !== fieldId));
  };

  const updateCustomFieldTitle = (fieldId: string, title: string) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId ? { ...field, title } : field
    ));
  };

  const addOptionToField = (fieldId: string) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId ? { ...field, options: [...field.options, ""] } : field
    ));
  };

  const removeOptionFromField = (fieldId: string, optionIndex: number) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId ? { 
        ...field, 
        options: field.options.filter((_, index) => index !== optionIndex) 
      } : field
    ));
  };

  const updateFieldOption = (fieldId: string, optionIndex: number, value: string) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId ? {
        ...field,
        options: field.options.map((option, index) => 
          index === optionIndex ? value : option
        )
      } : field
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/${tenantSlug}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
          prepTimeDays: formData.prepTimeDays ? parseInt(formData.prepTimeDays) : undefined,
          primaryCategoryId: formData.primaryCategoryId || undefined,
          images: images,
          imageUrl: images[0] || undefined, // Set first image as primary
          customFields: customFields.filter(field => 
            field.title && field.title.trim() && field.options && field.options.some(option => option && option.trim())
          ).map(field => ({
            id: field.id,
            title: field.title.trim(),
            options: field.options.filter(option => option && option.trim())
          }))
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuccess("Product created successfully!");
        setTimeout(() => {
          router.push(`/admin/${tenantSlug}/products`);
        }, 1500);
      } else {
        setError(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setError("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">إنشاء منتج</h1>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">عنوان المنتج *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="أدخل عنوان المنتج"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الفئة</label>
            <select
              value={formData.primaryCategoryId}
              onChange={(e) => setFormData({ ...formData, primaryCategoryId: e.target.value })}
              className="w-full rounded border p-2"
            >
              <option value="">اختر فئة</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">السعر (د.ك) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">سعر المقارنة (د.ك)</label>
            <input
              type="number"
              step="0.01"
              value={formData.compareAtPrice}
              onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">وقت التحضير (أيام)</label>
            <input
              type="number"
              value={formData.prepTimeDays}
              onChange={(e) => setFormData({ ...formData, prepTimeDays: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الحالة</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded border p-2"
            >
              <option value="DRAFT">مسودة</option>
              <option value="ACTIVE">نشط</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الوصف</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded border p-2 h-32"
            placeholder="أدخل وصف المنتج"
          />
        </div>

        {/* Custom Fields Section */}
        <div className="rounded border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">الحقول المخصصة</h3>
            <button
              type="button"
              onClick={addCustomField}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              + إضافة حقل مخصص
            </button>
          </div>
          
          {customFields.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              لا توجد حقول مخصصة. انقر على &quot;إضافة حقل مخصص&quot; لإنشاء حقل جديد.
            </p>
          ) : (
            <div className="space-y-4">
              {customFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      placeholder="عنوان الحقل (مثال: الحجم، اللون، المادة)"
                      value={field.title}
                      onChange={(e) => updateCustomFieldTitle(field.id, e.target.value)}
                      className="flex-1 rounded border p-2 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      حذف
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      الخيارات المتاحة:
                    </label>
                    {field.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`خيار ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) => updateFieldOption(field.id, optionIndex, e.target.value)}
                          className="flex-1 rounded border p-2"
                        />
                        {field.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOptionFromField(field.id, optionIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOptionToField(field.id)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      + إضافة خيار
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ImageUploader
          images={images}
          onImagesChange={setImages}
          maxImages={5}
          tenantSlug={tenantSlug}
        />


        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء المنتج"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
