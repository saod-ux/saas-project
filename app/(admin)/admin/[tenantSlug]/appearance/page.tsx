"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import HeroMediaManager from "@/components/admin/HeroMediaManager";
import LogoUploader from "@/components/admin/LogoUploader";
import { PageHelp } from "@/components/admin/PageHelp";

type AppearancePayload = {
  logoUrl: string | null;
  heroImages: string[];
  heroVideoUrl: string | null;
};

interface HeroMediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  poster?: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export default function AppearancePage() {
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') || 'en';
  const [appearance, setAppearance] = useState<AppearancePayload>({ 
    logoUrl: null, 
    heroImages: [], 
    heroVideoUrl: null 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAppearance = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/admin/${tenantSlug}/appearance`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        // Safe fallback
        setAppearance({ logoUrl: null, heroImages: [], heroVideoUrl: null });
        return;
      }

      const json = await res.json();
      const data: AppearancePayload = json?.appearance ?? { logoUrl: null, heroImages: [], heroVideoUrl: null };
      
      // Ensure arrays/strings are well-formed
      setAppearance({
        logoUrl: data.logoUrl ?? null,
        heroImages: Array.isArray(data.heroImages) ? data.heroImages : [],
        heroVideoUrl: data.heroVideoUrl ?? null,
      });
    } catch (err) {
      console.error("Error fetching appearance:", err);
      setError("Failed to load appearance settings");
      // Safe fallback
      setAppearance({ logoUrl: null, heroImages: [], heroVideoUrl: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppearance();
  }, [tenantSlug]);

  // Use safe defaults in the UI
  const logoUrl = appearance.logoUrl ?? "";
  const heroImages = appearance.heroImages ?? [];
  const initialHeroItems = heroImages.map((url, index) => ({
    id: `existing-${index}`,
    url,
    type: 'image' as const,
    poster: undefined,
    sortOrder: index,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }));
  const heroVideoUrl = appearance.heroVideoUrl ?? "";

  const handleLogoChange = async (logoUrl: string | null) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/admin/${tenantSlug}/logo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save logo");
      }
      
      setAppearance(prev => ({ ...prev, logoUrl }));
      
      // Show success message - no hard refresh needed
      console.log("Logo saved successfully");
    } catch (error) {
      console.error("Save logo error:", error);
      setError("Failed to save logo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8" dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

      return (
        <div className="space-y-6" dir="rtl">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">المظهر</h1>
                <p className="text-gray-600">تخصيص مظهر متجرك وشعارك</p>
              </div>
              <PageHelp pageKey="appearance" locale={locale} />
            </div>
          </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Logo Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الشعار</h2>
          <p className="text-gray-600">ارفع شعار متجرك ليظهر في جميع أنحاء الموقع</p>
        </div>
        <LogoUploader 
          tenantSlug={tenantSlug}
          currentLogoUrl={logoUrl}
          onLogoChange={handleLogoChange}
        />
      </div>

      {/* Hero Media Preview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">معاينة الوسائط الرئيسية</h2>
          <p className="text-gray-600">معاينة الصور والفيديوهات التي ستظهر في الصفحة الرئيسية</p>
        </div>
        
        {heroImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={url} 
                  alt={`Hero ${idx + 1}`} 
                  className="h-32 w-full rounded-lg object-cover bg-gray-100" 
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">صورة {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : heroVideoUrl ? (
          <div className="max-w-md">
            <video className="w-full rounded-lg" controls src={heroVideoUrl} />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد وسائط رئيسية</h3>
            <p className="text-gray-600">أضف صور أو فيديوهات لجعل متجرك أكثر جاذبية</p>
          </div>
        )}
      </div>

      {/* Hero Media Manager */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">إدارة الوسائط الرئيسية</h2>
          <p className="text-gray-600">أضف أو عدّل الصور والفيديوهات التي تظهر في الصفحة الرئيسية</p>
        </div>
        <HeroMediaManager tenantSlug={tenantSlug} initial={initialHeroItems} onSaved={fetchAppearance} />
      </div>
    </div>
  );
}