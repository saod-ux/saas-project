"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHelp } from "@/components/admin/PageHelp";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnOffer: boolean;
  featured: boolean;
  images?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
  primaryCategory?: {
    name: string;
  };
  imageUrl?: string;
}

export default function Products() {
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/products`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (data.ok) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      const response = await fetch(`/api/admin/${tenantSlug}/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(data.error || "فشل في حذف المنتج");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("فشل في حذف المنتج");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">المنتجات</h1>
        <div className="flex items-center gap-2">
          <PageHelp pageKey="products" locale="ar" />
          <Link href="products/new" className="rounded bg-black text-white px-3 py-2">
            إنشاء منتج
          </Link>
        </div>
      </div>
      
      <div className="rounded border bg-white divide-y">
        {products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="flex items-center justify-between px-4 py-3 hover:bg-black/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-neutral-200 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{product.title}</div>
                  <div className="text-sm text-neutral-500">
                    {product.primaryCategory?.name || "No category"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-600 flex gap-3">
                  <span>{product.price} {product.currency}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === "ACTIVE" 
                          ? "bg-green-100 text-green-700" 
                          : product.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {product.status === "ACTIVE" ? "نشط" : 
                         product.status === "DRAFT" ? "مسودة" : 
                         product.status}
                      </span>
                      {product.isBestSeller && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">الأكثر مبيعاً</span>}
                      {product.isNewArrival && <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-700 text-xs">وصل حديثاً</span>}
                      {product.isOnOffer && <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 text-xs">عرض</span>}
                      {product.featured && <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">مميز</span>}
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`products/${product.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    تعديل
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            لا توجد منتجات بعد.{" "}
            <Link href="products/new" className="text-black hover:underline">
              أنشئ منتجك الأول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
