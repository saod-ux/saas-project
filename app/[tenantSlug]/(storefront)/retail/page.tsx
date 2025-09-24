import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getAllDocuments, COLLECTIONS } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ThumbCard from "@/components/ui/ThumbCard";
import SlidableCategories from "@/components/store/SlidableCategories";
import { getServerDb } from "@/lib/firebase/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RetailPage({ params }:{
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Get content settings (merchant override first, then platform default)
  let heroSettings = null;
  try {
    const db = await getServerDb();
    
    // First, check for merchant-specific content override
    const merchantContentDoc = await db.collection('merchant-content').doc(tenant.id).get();
    if (merchantContentDoc.exists) {
      const merchantData = merchantContentDoc.data();
      if (merchantData?.hero?.enabled) {
        heroSettings = merchantData.hero;
      }
    }
    
    // If no merchant override or not enabled, check platform settings
    if (!heroSettings) {
      const platformContentDoc = await db.collection('platform').doc('content-settings').get();
      if (platformContentDoc.exists) {
        const platformData = platformContentDoc.data();
        if (platformData?.hero?.enabled) {
          heroSettings = platformData.hero;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching content settings:", error);
  }

  // Fetch hero slides with minimal index requirements
  let heroSlides: any[] = [];
  try {
    const db = await getServerDb();
    const heroSlidesSnapshot = await db.collection(COLLECTIONS?.HERO_SLIDES || 'heroSlides')
      .where('tenantId', '==', tenant.id)
      .get();

    heroSlides = heroSlidesSnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.seconds ? new Date(doc.data().createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.seconds ? new Date(doc.data().updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      }))
      .filter((slide: any) => slide.isActive !== false)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (error) {
    console.error("Error fetching hero slides:", error);
  }

  // Fetch active categories
  let categories: any[] = [];
  try {
    const allCategories = await getAllDocuments(COLLECTIONS?.CATEGORIES || 'categories');
    categories = allCategories
      .filter((cat: any) => cat.tenantId === tenant.id && cat.isActive)
      .sort((a: any, b: any) => {
        if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 8) // Limit for retail page
      .map((cat: any) => ({
        ...cat,
        nameAr: cat.nameAr || cat.name, // Add Arabic name support
        imageUrl: cat.imageUrl || null, // Ensure imageUrl is available
        isActive: cat.isActive !== false, // Default to true if not specified
        createdAt: cat.createdAt?.seconds ? new Date(cat.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: cat.updatedAt?.seconds ? new Date(cat.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden hero-section">
        {heroSlides.length > 0 ? (
          <>
            {heroSlides.length === 1 ? (
              // Single image/video
              <div className="relative w-full h-full">
                {heroSlides[0].type === "image" ? (
                  <img
                    src={heroSlides[0].url}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={heroSlides[0].url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    controls={false}
                    autoPlay
                    loop
                  />
                )}
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ) : (
              // Carousel for multiple slides
              <div className="relative w-full h-full">
                <div className="absolute inset-0">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === 0 ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {slide.type === "image" ? (
                        <img
                          src={slide.url}
                          alt={`Hero ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={slide.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          controls={false}
                          autoPlay
                          loop
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Navigation dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === 0 ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Hero Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                  {heroSettings?.enabled && heroSettings.title ? heroSettings.title : tenant.name}
                </h1>
                <p className="text-xl md:text-2xl mb-8 drop-shadow-lg">
                  {heroSettings?.enabled && heroSettings.description ? heroSettings.description : "اكتشف مجموعتنا المميزة من المنتجات"}
                </p>
                <Link
                  href={heroSettings?.enabled && heroSettings.ctaLink ? `/${params.tenantSlug}${heroSettings.ctaLink}` : `/${params.tenantSlug}/categories`}
                  className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  {heroSettings?.enabled && heroSettings.ctaText ? heroSettings.ctaText : "تسوق الآن"}
                </Link>
              </div>
            </div>
          </>
        ) : (
          // Fallback gradient background
          <div className="relative w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                  {heroSettings?.enabled && heroSettings.title ? heroSettings.title : tenant.name}
                </h1>
                <p className="text-xl md:text-2xl mb-8 drop-shadow-lg">
                  {heroSettings?.enabled && heroSettings.description ? heroSettings.description : "اكتشف مجموعتنا المميزة من المنتجات"}
                </p>
                <Link
                  href={heroSettings?.enabled && heroSettings.ctaLink ? `/${params.tenantSlug}${heroSettings.ctaLink}` : `/${params.tenantSlug}/categories`}
                  className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  {heroSettings?.enabled && heroSettings.ctaText ? heroSettings.ctaText : "تسوق الآن"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 md:py-20 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                تصفح الفئات
              </h2>
              <p className="text-lg text-gray-600">
                اكتشف منتجاتنا المتنوعة في مختلف الفئات
              </p>
            </div>
            
            <SlidableCategories 
              categories={categories} 
              tenantSlug={params.tenantSlug}
            />
          </div>
        </section>
      )}

      {/* Trust + Featured Products Section (8pt spacing) */}
      <section className="py-16 md:py-20 px-4 md:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Trust Elements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-xl font-semibold mb-2">شحن مجاني</div>
              <div className="text-gray-600">للطلبيات فوق 20 د.ك</div>
            </div>
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-xl font-semibold mb-2">إرجاع سهل</div>
              <div className="text-gray-600">خلال 30 يوماً</div>
            </div>
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="text-xl font-semibold mb-2">دفع آمن</div>
              <div className="text-gray-600">طرق دفع متعددة</div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              منتجات مميزة
            </h2>
            <p className="text-lg text-gray-600">
              اكتشف أفضل منتجاتنا المختارة خصيصاً لك
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Placeholder for featured products */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  منتج مميز {i}
                </h3>
                <p className="text-gray-600 mb-4">
                  وصف المنتج المميز
                </p>
                <div className="text-xl font-bold text-blue-600">
                  25.00 د.ك
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}