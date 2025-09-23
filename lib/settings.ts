import { z } from "zod";

// Storefront Theme Schema
export const storefrontThemeSchema = z.object({
  primary: z.string().default('#1F2937'),
  accent: z.string().default('#111827'),
  bg: z.string().default('#FAF7F2'),
  card: z.string().default('#FFFFFF'),
  text: z.string().default('#1F2937'),
  logoUrl: z.string().optional(),
})

// Hero Settings Schema
export const heroSettingsSchema = z.object({
  showHero: z.boolean().default(true),
  heroTitle: z.string().default(''),
  heroSubtitle: z.string().default(''),
  heroCtaLabel: z.string().default(''),
  heroCtaHref: z.string().default('#products'),
  heroImageUrl: z.string().optional(),
})

// Localization Schema
export const localizationSchema = z.object({
  locale: z.enum(['en-US', 'ar-KW']).default('en-US'),
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
})

// Social Links Schema
export const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  whatsapp: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
})

// Contact Info Schema
export const contactInfoSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

// Branding Schema
export const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
})

// Categories Schema
export const categoriesSchema = z.object({
  enabled: z.boolean().default(true),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    sortOrder: z.number().default(0),
    isActive: z.boolean().default(true),
  })).default([]),
})

// Payment Settings Schema
export const paymentSettingsSchema = z.object({
  myfatoorahApiKey: z.string().default(''),
  myfatoorahSecretKey: z.string().default(''),
  myfatoorahIsTest: z.boolean().default(true),
  knetMerchantId: z.string().default(''),
  knetApiKey: z.string().default(''),
  knetIsTest: z.boolean().default(true),
  stripePublishableKey: z.string().default(''),
  stripeSecretKey: z.string().default(''),
  stripeIsTest: z.boolean().default(true),
})

// SEO Settings Schema
export const seoSettingsSchema = z.object({
  metaTitle: z.string().default(''),
  metaDescription: z.string().default(''),
  ogImageUrl: z.string().default(''),
  redirectToCustomDomain: z.boolean().default(false),
  edgeCacheTTL: z.number().default(60),
})

// Media Settings Schema
export const mediaSettingsSchema = z.object({
  maxImageMB: z.number().default(10),
  allowedImageTypes: z.string().default("image/jpeg,image/png,image/webp"),
  allowPublicApiFromCustomDomain: z.boolean().default(false),
})

// Main Settings Schema
export const tenantSettingsSchema = z.object({
  // Basic Info
  storeName: z.string().default(''),
  description: z.string().default(''),
  
  // Storefront Settings
  storefront: z.object({
    theme: storefrontThemeSchema,
    hero: heroSettingsSchema,
    localization: localizationSchema,
  }).default({
    theme: storefrontThemeSchema.parse({}),
    hero: heroSettingsSchema.parse({}),
    localization: localizationSchema.parse({}),
  }),
  
  // Other Settings
  social: socialLinksSchema.default({}),
  contactInfo: contactInfoSchema.default({}),
  branding: brandingSchema.default({}),
  categories: categoriesSchema.default({}),
  payment: paymentSettingsSchema.default({}),
  seo: seoSettingsSchema.default({}),
  media: mediaSettingsSchema.default({}),
  
  // Version
  settingsVersion: z.number().default(1),
})

// Default settings
export const defaultSettings = tenantSettingsSchema.parse({})

// Type for settings
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

// Helper function to convert null values to undefined for Zod validation
function cleanNullValues(obj: any): any {
  if (obj === null) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanNullValues);
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = cleanNullValues(value);
  }
  return cleaned;
}

// Upgrade settings to latest version
export function upgradeSettings(currentSettings: any): TenantSettings {
  const version = currentSettings.settingsVersion || 0
  
  if (version <= 1) {
    // Migrate from old format to new format
    // Preserve existing social media URLs from the database
    const existingSocial = currentSettings.social || {};
    
    const settingsToParse = {
      storeName: currentSettings.storeName || '',
      description: currentSettings.description || '',
      storefront: {
        theme: {
          primary: currentSettings.primary || currentSettings.storefront?.theme?.primary || '#1F2937',
          accent: currentSettings.accent || currentSettings.storefront?.theme?.accent || '#111827',
          bg: currentSettings.bg || currentSettings.storefront?.theme?.bg || '#FAF7F2',
          card: currentSettings.card || currentSettings.storefront?.theme?.card || '#FFFFFF',
          text: currentSettings.text || currentSettings.storefront?.theme?.text || '#1F2937',
          logoUrl: currentSettings.logoUrl || currentSettings.storefront?.theme?.logoUrl || undefined,
        },
        hero: {
          showHero: currentSettings.showHero ?? currentSettings.storefront?.hero?.showHero ?? true,
          heroTitle: currentSettings.heroTitle || currentSettings.storefront?.hero?.heroTitle || '',
          heroSubtitle: currentSettings.heroSubtitle || currentSettings.storefront?.hero?.heroSubtitle || '',
          heroCtaLabel: currentSettings.heroCtaLabel || currentSettings.storefront?.hero?.heroCtaLabel || '',
          heroCtaHref: currentSettings.heroCtaHref || currentSettings.storefront?.hero?.heroCtaHref || '#products',
          heroImageUrl: currentSettings.heroImageUrl || currentSettings.storefront?.hero?.heroImageUrl,
        },
        localization: {
          direction: currentSettings.direction || currentSettings.storefront?.localization?.direction || 'ltr',
          locale: currentSettings.locale || currentSettings.storefront?.localization?.locale || 'en-US',
        },
      },
      social: {
        instagram: currentSettings.instagramUrl || currentSettings.socialLinks?.instagram || currentSettings.social?.instagram || '',
        facebook: currentSettings.facebookUrl || currentSettings.socialLinks?.facebook || currentSettings.social?.facebook || '',
        twitter: currentSettings.twitterUrl || currentSettings.socialLinks?.twitter || currentSettings.social?.twitter || '',
        whatsapp: currentSettings.whatsappUrl || currentSettings.socialLinks?.whatsapp || currentSettings.social?.whatsapp || '',
        tiktok: currentSettings.tiktokUrl || currentSettings.socialLinks?.tiktok || currentSettings.social?.tiktok || '',
        snapchat: currentSettings.snapchatUrl || currentSettings.socialLinks?.snapchat || currentSettings.social?.snapchat || '',
        website: currentSettings.websiteUrl || currentSettings.socialLinks?.website || currentSettings.social?.website || '',
      },
      contactInfo: currentSettings.contactInfo || {},
      branding: currentSettings.branding || {},
      categories: {
        enabled: true,
        items: Array.isArray(currentSettings.categories) ? currentSettings.categories : (Array.isArray(currentSettings.categories?.items) ? currentSettings.categories.items : []),
      },
      payment: {
        myfatoorahApiKey: currentSettings.myfatoorahApiKey || '',
        myfatoorahSecretKey: currentSettings.myfatoorahSecretKey || '',
        myfatoorahIsTest: currentSettings.myfatoorahIsTest ?? true,
        knetMerchantId: currentSettings.knetMerchantId || '',
        knetApiKey: currentSettings.knetApiKey || '',
        knetIsTest: currentSettings.knetIsTest ?? true,
        stripePublishableKey: currentSettings.stripePublishableKey || '',
        stripeSecretKey: currentSettings.stripeSecretKey || '',
        stripeIsTest: currentSettings.stripeIsTest ?? true,
      },
      seo: {
        metaTitle: currentSettings.seo?.metaTitle || '',
        metaDescription: currentSettings.seo?.metaDescription || '',
        ogImageUrl: currentSettings.seo?.ogImageUrl || '',
        redirectToCustomDomain: currentSettings.seo?.redirectToCustomDomain ?? false,
        edgeCacheTTL: currentSettings.seo?.edgeCacheTTL ?? 60,
      },
      media: {
        maxImageMB: currentSettings.media?.maxImageMB ?? 10,
        allowedImageTypes: currentSettings.media?.allowedImageTypes || "image/jpeg,image/png,image/webp",
        allowPublicApiFromCustomDomain: currentSettings.media?.allowPublicApiFromCustomDomain ?? false,
      },
      settingsVersion: 1,
    }
    
    return tenantSettingsSchema.parse(cleanNullValues(settingsToParse))
  }
  
  // Already at latest version, just validate
  return tenantSettingsSchema.parse(cleanNullValues(currentSettings))
}

// Extract storefront settings for components
export function getStorefrontSettings(settings: TenantSettings) {
  return {
    theme: settings.storefront.theme,
    hero: settings.storefront.hero,
    localization: settings.storefront.localization,
  }
}