"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHelp } from "@/components/admin/PageHelp";

export default function SettingsPage() {
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const [data, setData] = useState<any>({ language: "ar", currency: "KWD" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/${tenantSlug}/settings`);
      setData((await res.json()).data);
    })();
  }, [tenantSlug]);

  async function save() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/${tenantSlug}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (result.ok) {
        setSuccess("Settings saved successfully!");
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (error) {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">الإعدادات</h1>
        <PageHelp pageKey="settings" locale="ar" />
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

      <Row label="اللغة الافتراضية">
        <select value={data.language} onChange={(e) => setData({ ...data, language: e.target.value })} className="rounded border p-2">
          <option value="ar">العربية</option>
          <option value="en">الإنجليزية</option>
        </select>
      </Row>

      <Row label="العملة">
        <input className="rounded border p-2" value={data.currency} onChange={(e)=>setData({ ...data, currency: e.target.value })}/>
      </Row>

      {/* Social Media Section */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">وسائل التواصل الاجتماعي</h2>
        <p className="text-sm text-gray-600 mb-4">أدخل اسم المستخدم أو المعرف فقط لكل منصة. سنقوم بإنشاء الرابط الكامل تلقائياً.</p>
        
        <Row label="إنستغرام اسم المستخدم">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">@</span>
            <input 
              className="rounded border p-2 w-full" 
              placeholder="your_username"
              value={data.instagramUrl?.replace('www.instagram.com/', '').replace('instagram.com/', '') ?? ""} 
              onChange={(e)=>setData({ ...data, instagramUrl: e.target.value })}/>
          </div>
        </Row>
        
        <Row label="واتساب رقم الهاتف">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">+</span>
            <input 
              className="rounded border p-2 w-full" 
              placeholder="1234567890"
              value={data.whatsappUrl ?? ""} 
              onChange={(e)=>setData({ ...data, whatsappUrl: e.target.value })}/>
          </div>
        </Row>
        
        <Row label="تيك توك اسم المستخدم">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">@</span>
            <input 
              className="rounded border p-2 w-full" 
              placeholder="your_username"
              value={data.tiktokUrl?.replace('www.tiktok.com/', '').replace('tiktok.com/', '') ?? ""} 
              onChange={(e)=>setData({ ...data, tiktokUrl: e.target.value })}/>
          </div>
        </Row>
        
        <Row label="سناب شات اسم المستخدم">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">@</span>
            <input 
              className="rounded border p-2 w-full" 
              placeholder="your_username"
              value={data.snapchatUrl?.replace('snapchat.com/', '') ?? ""} 
              onChange={(e)=>setData({ ...data, snapchatUrl: e.target.value })}/>
          </div>
        </Row>
      </div>


      {/* Media Settings Section */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">إعدادات الوسائط</h2>
        
        <Row label="الحد الأقصى لحجم الصورة (MB)">
          <input 
            type="number" 
            min="1" 
            max="50" 
            className="rounded border p-2 w-32" 
            value={data.media?.maxImageMB ?? 10} 
            onChange={(e)=>setData({ 
              ...data, 
              media: { ...data.media, maxImageMB: parseInt(e.target.value) || 10 }
            })}
          />
          <span className="text-sm text-gray-600 ml-2">
            الحد الأقصى لحجم الملف لرفع الصور (1-50 ميجابايت)
          </span>
        </Row>

        <Row label="Allowed Image Formats">
          <div className="space-y-2">
            {[
              { value: "image/jpeg", label: "JPEG" },
              { value: "image/png", label: "PNG" },
              { value: "image/webp", label: "WebP" },
            ].map((format) => {
              const allowedTypes = (data.media?.allowedImageTypes || "image/jpeg,image/png,image/webp").split(",");
              const isChecked = allowedTypes.includes(format.value);
              
              return (
                <label key={format.value} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => {
                      const currentTypes = (data.media?.allowedImageTypes || "image/jpeg,image/png,image/webp").split(",");
                      let newTypes;
                      if (e.target.checked) {
                        newTypes = [...currentTypes, format.value];
                      } else {
                        newTypes = currentTypes.filter((t: string) => t !== format.value);
                      }
                      setData({ 
                        ...data, 
                        media: { ...data.media, allowedImageTypes: newTypes.join(",") }
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{format.label}</span>
                </label>
              );
            })}
          </div>
        </Row>

        <Row label="Allow Public API from Custom Domain">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={data.media?.allowPublicApiFromCustomDomain ?? false}
              onChange={(e)=>setData({ 
                ...data, 
                media: { ...data.media, allowPublicApiFromCustomDomain: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-600">
              Allow API calls from verified custom domains (CORS)
            </span>
          </div>
        </Row>
      </div>

      <div className="mt-6">
        <button 
          onClick={save}
          disabled={loading}
          className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
        >
          {loading ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-sm">{label}</div>
      {children}
    </div>
  );
}
